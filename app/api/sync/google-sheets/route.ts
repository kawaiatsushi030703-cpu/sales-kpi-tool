import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 対象スプレッドシートの固定情報
const SPREADSHEET_ID = '1G35llv5W0EcJejs4XwBGQap5SgctlBkvUAIiRhuxo3s'
const SHEET_GIDS = [
  { gid: '1071099269', name: '抽出一覧' },
  { gid: '584739629',  name: '美奈子セミナー' },
  { gid: '899957548',  name: 'クローザー報告' },
]

function detectCategory(productName: string): string {
  return /AI|ai|エーアイ/i.test(productName) ? 'AI' : '物販'
}

function toSheetsCsvUrl(sheetId: string, gid: string): string {
  // gviz/tq エンドポイントはリダイレクトなしで直接CSVを返すため安定
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`
}

function parseDate(str: string): Date | null {
  if (!str) return null
  const fullMatch = str.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/)
  if (fullMatch) return new Date(parseInt(fullMatch[1]), parseInt(fullMatch[2]) - 1, parseInt(fullMatch[3]))
  // 「4月 2日」「4月2日」形式に対応
  const jpMatch = str.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*日/)
  if (jpMatch) {
    const now = new Date()
    const m = parseInt(jpMatch[1])
    const d = parseInt(jpMatch[2])
    const y = m > now.getMonth() + 1 ? now.getFullYear() - 1 : now.getFullYear()
    return new Date(y, m - 1, d)
  }
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
  const isMan = /万/.test(str)  // 明示的に「万」がある場合のみ×10000
  const cleaned = str.replace(/[,，円¥\s万]/g, '')
  const num = parseFloat(cleaned)
  if (isNaN(num)) return 0
  return isMan ? Math.round(num * 10000) : Math.round(num)
}

// 成約結果フィールドのパース（スプシ独自形式）
interface ContractResult {
  status: string
  productName: string
  contractAmount: number
}

const STATUS_KEYWORD_MAP: Record<string, string> = {
  '未成約':    '未成約',
  '2回目遷移': '2回目遷移',
  '3回目遷移': '2回目遷移',
  '4回目遷移': '2回目遷移',
  '音信不通':  '未成約',
  '決済待ち':  '決済待ち',
  '一部決済':  '一部決済',
  '保留':      '後追い',
  '後追い':    '後追い',
  '成約':      '成約',
}

function parseContractResult(raw: string): ContractResult {
  const trimmed = raw.trim()

  // 1. 既知のステータスキーワードに前方一致するか確認
  for (const [keyword, status] of Object.entries(STATUS_KEYWORD_MAP)) {
    if (trimmed === keyword || trimmed.startsWith(keyword)) {
      return { status, productName: '未設定', contractAmount: 0 }
    }
  }

  // 2. 空文字 → 後追い
  if (!trimmed) {
    return { status: '後追い', productName: '未設定', contractAmount: 0 }
  }

  // 3. 金額を抽出 (例: "29.8万", "55万円", "5.98万円", "330万")
  let contractAmount = 0
  const manMatch = trimmed.match(/([\d.]+)\s*万円?/)
  if (manMatch) {
    contractAmount = Math.round(parseFloat(manMatch[1]) * 10000)
  } else {
    const plainMatch = trimmed.match(/([\d,]+)\s*円/)
    if (plainMatch) {
      contractAmount = parseInt(plainMatch[1].replace(/,/g, ''), 10) || 0
    }
  }

  // 4. ステータス判定: 一部振込/分割 → 一部決済、それ以外 → 成約
  const isPartial = /一部|分割/.test(trimmed)
  const status = isPartial ? '一部決済' : '成約'

  // 5. 商品名: 数字が始まる前のテキスト（例: "AI ONE 29.8万" → "AI ONE"）
  const productName = trimmed
    .replace(/([\d.]+\s*万円?[\s\S]*)/, '')
    .replace(/([\d,]+\s*円[\s\S]*)/, '')
    .trim() || trimmed.substring(0, 30)

  return { status, productName, contractAmount }
}

function detectColumns(headers: string[]) {
  const h = headers.map((s) => s.trim().toLowerCase())
  const find = (...keys: string[]) => h.findIndex((col) => keys.some((k) => col.includes(k)))
  return {
    customerName:    find('顧客', 'customer', 'line名', 'お客', '名前', '氏名'),
    memberName:      find('担当', 'member', 'メンバー', 'クローザー'),
    productName:     find('商品', '製品', 'product', 'プラン', 'サービス', '商品名'),
    category:        find('カテゴリ', 'category'),
    contractAmount:  find('契約額', '売上', '売り上げ', 'contract', '金額'),
    paymentAmount:   find('着金', 'payment', '入金'),
    status:          find('ステータス', 'status', '状態'),
    contractResult:  find('成約結果'),  // スプシ独自列
    meetingDate:     find('面談日', '日時', 'meeting', '商談日', '年月日'),
    dueDate:         find('期日', 'due', '締切'),
    nextAction:      find('次回', 'action', 'アクション', '録画'),
    notes:           find('原文', '備考', 'notes', 'メモ', '客層', '導線'),
  }
}

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

async function syncFromSheet(gid: string, sheetName: string) {
  const csvUrl = toSheetsCsvUrl(SPREADSHEET_ID, gid)
  const res = await fetch(csvUrl)
  if (!res.ok) throw new Error(`${sheetName}: スプレッドシートの取得に失敗しました (HTTP ${res.status})`)
  const text = await res.text()

  const lines = text.split('\n').filter((l) => l.trim())
  if (lines.length < 2) return { imported: 0, skipped: 0, total: 0, unknownMembers: [] as string[] }

  const headers = parseCsvLine(lines[0])
  const cols = detectColumns(headers)

  if (cols.customerName === -1) {
    throw new Error(`${sheetName}: 「顧客名/LINE名」列が見つかりません。ヘッダー: ${headers.join(', ')}`)
  }

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

    let customerName = get(cols.customerName)
    if (!customerName) {
      // LINE名が空でも売上金額がある場合は、導線名を代替キーとして記録する
      const dosenName = get(cols.notes)
      const hasSales = parseAmount(get(cols.contractAmount)) > 0 || parseAmount(get(cols.paymentAmount)) > 0
      if (dosenName && hasSales) {
        customerName = `(${dosenName.substring(0, 40)})`
      } else {
        skipped++
        continue
      }
    }

    const memberNameStr = get(cols.memberName)
    const member = findMember(memberNameStr)
    if (!member) { if (memberNameStr) unknownMembers.add(memberNameStr); skipped++; continue }

    // 成約結果列がある場合はそこからステータス/商品名/金額を導出
    let status: string
    let productName: string
    let contractAmount: number

    if (cols.contractResult >= 0) {
      const raw = get(cols.contractResult)
      const parsed = parseContractResult(raw)
      status = parsed.status
      // 商品名カラムが別途あればそちらを優先
      const explicitProduct = cols.productName >= 0 ? get(cols.productName) : ''
      productName = explicitProduct || parsed.productName || '未設定'
      contractAmount = parsed.contractAmount
      // 売上カラムが別途あればそちらを優先
      const explicitAmount = parseAmount(get(cols.contractAmount))
      if (explicitAmount > 0) contractAmount = explicitAmount
    } else {
      productName = get(cols.productName) || '未設定'
      contractAmount = parseAmount(get(cols.contractAmount))
      status = get(cols.status) || '後追い'
    }

    const categoryRaw = get(cols.category)
    const category = categoryRaw || detectCategory(productName)
    const paymentAmount = parseAmount(get(cols.paymentAmount))
    const meetingDate = parseDate(get(cols.meetingDate))
    const dueDate = parseDate(get(cols.dueDate))
    const nextAction = get(cols.nextAction) || null
    const notes = get(cols.notes) || null

    const existing = await prisma.deal.findFirst({
      where: { customerName, memberId: member.id },
    })

    // 着金レコードを作成するのは成約・一部決済・完了のみ
    const canHavePayment = ['成約', '一部決済', '完了'].includes(status)
    const effectivePayment = canHavePayment ? paymentAmount : 0

    if (existing) {
      const finalPayment = effectivePayment > 0 ? effectivePayment : (canHavePayment ? existing.paymentAmount : 0)
      const finalContract = contractAmount > 0 ? contractAmount : existing.contractAmount
      await prisma.deal.update({
        where: { id: existing.id },
        data: { productName, category, contractAmount: finalContract, paymentAmount: finalPayment, remainingAmount: finalContract - finalPayment, status, meetingDate, dueDate, nextAction, notes },
      })
      if (effectivePayment > 0 && effectivePayment !== existing.paymentAmount) {
        await prisma.payment.deleteMany({ where: { dealId: existing.id } })
        await prisma.payment.create({ data: { dealId: existing.id, amount: finalPayment, paidAt: meetingDate ?? new Date() } })
      }
    } else {
      const deal = await prisma.deal.create({
        data: { customerName, memberId: member.id, productName, category, contractAmount, paymentAmount: effectivePayment, remainingAmount: contractAmount - effectivePayment, status, meetingDate, dueDate, nextAction, notes },
      })
      if (effectivePayment > 0) {
        await prisma.payment.create({ data: { dealId: deal.id, amount: effectivePayment, paidAt: meetingDate ?? new Date() } })
      }
    }
    imported++
  }

  return { imported, skipped, total: lines.length - 1, unknownMembers: [...unknownMembers] }
}

// Google Apps Script から呼ばれる webhook エンドポイント
export async function POST(req: NextRequest) {
  try {
    // シークレットトークン認証
    const secret = req.headers.get('x-sync-secret')
    const expectedSecret = process.env.SYNC_SECRET
    if (!expectedSecret || secret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 両シートを順番にインポート
    const results = []
    let totalImported = 0
    let totalSkipped = 0
    const allUnknownMembers = new Set<string>()

    for (const sheet of SHEET_GIDS) {
      const result = await syncFromSheet(sheet.gid, sheet.name)
      results.push({ sheet: sheet.name, gid: sheet.gid, ...result })
      totalImported += result.imported
      totalSkipped += result.skipped
      result.unknownMembers.forEach((m) => allUnknownMembers.add(m))
    }

    // 一部決済・決済待ちの通知を自動生成
    const urgentDeals = await prisma.deal.findMany({
      where: { status: { in: ['一部決済', '決済待ち'] } },
      include: { notifications: true },
    })
    let notificationsCreated = 0
    for (const deal of urgentDeals) {
      if (deal.notifications.length === 0) {
        const type = deal.status === '一部決済' ? 'partial_payment' : 'payment_pending'
        const message = deal.status === '一部決済'
          ? `【一部決済】「${deal.customerName}」案件の残額の回収が未完了です`
          : `【決済待ち】「${deal.customerName}」案件の決済が完了していません`
        await prisma.notification.create({
          data: { dealId: deal.id, memberId: deal.memberId, type, message },
        })
        notificationsCreated++
      }
    }

    const now = new Date().toISOString()
    console.log(`[sync] ${now} - imported: ${totalImported}, skipped: ${totalSkipped}, notifications: ${notificationsCreated}`)

    return NextResponse.json({
      success: true,
      syncedAt: now,
      imported: totalImported,
      skipped: totalSkipped,
      unknownMembers: [...allUnknownMembers],
      sheets: results,
      notificationsCreated,
    })
  } catch (error) {
    console.error('[sync] error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// 手動確認用 GET（認証なし、同期はしない）
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'POST with x-sync-secret header to trigger sync',
    sheets: SHEET_GIDS.map((s) => s.name),
    secretConfigured: !!process.env.SYNC_SECRET,
  })
}
