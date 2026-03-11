import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function detectCategory(productName: string): string {
  return /AI|ai|エーアイ/i.test(productName) ? 'AI' : '物販'
}

function toSheetsCsvUrl(url: string): string {
  // https://docs.google.com/spreadsheets/d/SHEET_ID/edit... → CSV export URL
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
  if (!match) throw new Error('Google SheetsのURLではありません')
  const sheetId = match[1]
  const gidMatch = url.match(/[#&?]gid=(\d+)/)
  const gid = gidMatch ? gidMatch[1] : '0'
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`
}

function parseDate(str: string): Date | null {
  if (!str) return null
  // 2025/3/10, 2025-03-10, 3/10, 3月10日 など
  const fullMatch = str.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/)
  if (fullMatch) return new Date(parseInt(fullMatch[1]), parseInt(fullMatch[2]) - 1, parseInt(fullMatch[3]))
  const shortMatch = str.match(/(\d{1,2})[\/月](\d{1,2})/)
  if (shortMatch) {
    const now = new Date()
    const m = parseInt(shortMatch[1])
    const d = parseInt(shortMatch[2])
    const y = m > now.getMonth() + 1 ? now.getFullYear() - 1 : now.getFullYear()
    return new Date(y, m - 1, d)
  }
  return null
}

function parseAmount(str: string): number {
  if (!str) return 0
  const cleaned = str.replace(/[,，円¥\s]/g, '')
  const num = parseFloat(cleaned)
  if (isNaN(num)) return 0
  // 10000未満なら万円単位とみなす
  return num < 10000 ? Math.round(num * 10000) : Math.round(num)
}

// ヘッダー名から列インデックスを推測
function detectColumns(headers: string[]) {
  const h = headers.map((s) => s.trim().toLowerCase())
  const find = (...keys: string[]) => h.findIndex((col) => keys.some((k) => col.includes(k)))
  return {
    customerName:   find('顧客', 'customer', 'line名', 'お客', '名前', '氏名'),
    memberName:     find('担当', 'member', 'メンバー', 'クローザー'),
    productName:    find('商品', '製品', 'product', 'プラン', 'サービス'),
    category:       find('カテゴリ', 'category'),
    contractAmount: find('契約額', '売上', '売り上げ', 'contract', '金額'),
    paymentAmount:  find('着金', 'payment', '入金', '決済'),
    status:         find('ステータス', 'status', '状態'),
    meetingDate:    find('面談日', '日時', 'meeting', '商談日', '年月日'),
    dueDate:        find('期日', 'due', '締切'),
    nextAction:     find('次回', 'action', 'アクション'),
    notes:          find('備考', '備考', 'notes', 'メモ'),
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    const csvUrl = toSheetsCsvUrl(url)

    const res = await fetch(csvUrl)
    if (!res.ok) throw new Error('スプレッドシートの取得に失敗しました。「リンクを知っている全員が閲覧可」に設定してください。')
    const text = await res.text()

    // CSV解析（引用符内カンマ対応）
    function parseCsvLine(line: string): string[] {
      const result: string[] = []
      let cur = ''
      let inQuote = false
      for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (ch === '"') {
          if (inQuote && line[i + 1] === '"') { cur += '"'; i++ }
          else inQuote = !inQuote
        } else if (ch === ',' && !inQuote) {
          result.push(cur.trim())
          cur = ''
        } else {
          cur += ch
        }
      }
      result.push(cur.trim())
      return result
    }

    const lines = text.split('\n').filter((l) => l.trim())
    if (lines.length < 2) return NextResponse.json({ error: 'データが見つかりません' }, { status: 400 })

    const headers = parseCsvLine(lines[0])
    const cols = detectColumns(headers)

    if (cols.customerName === -1) {
      return NextResponse.json({
        error: '「顧客名」列が見つかりません',
        headers,
        detected: cols,
      }, { status: 400 })
    }

    // メンバー一覧を取得
    const members = await prisma.member.findMany()
    const findMember = (name: string) => {
      const n = name.trim().replace(/[\s　]/g, '')
      if (!n) return undefined
      return members.find((m) => {
        const mn = m.name.replace(/[\s　]/g, '')
        return mn === n || mn.includes(n) || n.includes(mn)
      })
    }

    let imported = 0
    let skipped = 0
    const unknownMembers = new Set<string>()

    for (let i = 1; i < lines.length; i++) {
      const cells = parseCsvLine(lines[i])
      const get = (idx: number) => idx >= 0 ? (cells[idx] ?? '') : ''

      const customerName = get(cols.customerName)
      if (!customerName) { skipped++; continue }

      const memberNameStr = get(cols.memberName)
      const member = findMember(memberNameStr)
      if (!member) { if (memberNameStr) unknownMembers.add(memberNameStr); skipped++; continue }

      const productName = get(cols.productName) || '未設定'
      const categoryRaw = get(cols.category)
      const category = categoryRaw || detectCategory(productName)
      const contractAmount = parseAmount(get(cols.contractAmount))
      const paymentAmount = parseAmount(get(cols.paymentAmount))
      const status = get(cols.status) || '後追い'
      const meetingDate = parseDate(get(cols.meetingDate))
      const dueDate = parseDate(get(cols.dueDate))
      const nextAction = get(cols.nextAction) || null
      const notes = get(cols.notes) || null

      // 同じ顧客名+メンバーの既存案件があれば更新、なければ作成
      const existing = await prisma.deal.findFirst({
        where: { customerName, memberId: member.id },
      })

      if (existing) {
        await prisma.deal.update({
          where: { id: existing.id },
          data: { productName, category, contractAmount, paymentAmount, remainingAmount: contractAmount - paymentAmount, status, meetingDate, dueDate, nextAction, notes },
        })
        await prisma.payment.deleteMany({ where: { dealId: existing.id } })
        if (paymentAmount > 0) {
          await prisma.payment.create({ data: { dealId: existing.id, amount: paymentAmount, paidAt: meetingDate ?? new Date() } })
        }
      } else {
        const deal = await prisma.deal.create({
          data: { customerName, memberId: member.id, productName, category, contractAmount, paymentAmount, remainingAmount: contractAmount - paymentAmount, status, meetingDate, dueDate, nextAction, notes },
        })
        if (paymentAmount > 0) {
          await prisma.payment.create({ data: { dealId: deal.id, amount: paymentAmount, paidAt: meetingDate ?? new Date() } })
        }
      }
      imported++
    }

    return NextResponse.json({ imported, skipped, total: lines.length - 1, unknownMembers: [...unknownMembers] })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
