import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function detectCategory(productName: string): string {
  return /AI|ai|エーアイ/i.test(productName) ? 'AI' : '物販'
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)
    const deal = await prisma.deal.findUnique({
      where: { id },
      include: {
        member: { select: { name: true, avatarColor: true } },
        payments: { orderBy: { paidAt: 'asc' } },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        events: { orderBy: { date: 'asc' } } as any,
      },
    })
    if (!deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    return NextResponse.json({ ...deal, memberName: deal.member.name })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch deal' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)
    const body = await req.json()

    const contractAmount = Math.round(body.contractAmount ?? 0)
    const isQuickUpdate = body.editedPayments === undefined && body.additionalPaymentAmount === undefined

    let paymentAmount: number

    if (isQuickUpdate) {
      // テーブルのクイック更新：Payment を入力値で全置換
      const newPaymentAmount = Math.round(body.paymentAmount ?? 0)
      await prisma.payment.deleteMany({ where: { dealId: id } })
      if (newPaymentAmount > 0) {
        const existing = await prisma.deal.findUnique({ where: { id }, select: { meetingDate: true } })
        const paidAt = body.meetingDate ? new Date(body.meetingDate) : (existing?.meetingDate ?? new Date())
        await prisma.payment.create({ data: { dealId: id, amount: newPaymentAmount, paidAt } })
      }
      paymentAmount = newPaymentAmount
    } else {
      // フォーム経由の詳細更新

      // 1. 削除対象のPaymentを削除
      const deletedPaymentIds: number[] = body.deletedPaymentIds ?? []
      if (deletedPaymentIds.length > 0) {
        await prisma.payment.deleteMany({ where: { id: { in: deletedPaymentIds }, dealId: id } })
      }

      // 2. 既存Paymentを編集（金額・日付の修正）
      const editedPayments: { id: number; amount: number; paidAt: string }[] = body.editedPayments ?? []
      for (const ep of editedPayments) {
        await prisma.payment.update({
          where: { id: ep.id },
          data: { amount: Math.round(ep.amount), paidAt: new Date(ep.paidAt) },
        })
      }

      // 3. 追加決済があれば新規Paymentレコードを追加
      const additionalPaymentAmount = Math.round(body.additionalPaymentAmount ?? 0)
      const additionalPaymentDate = body.additionalPaymentDate ?? null
      if (additionalPaymentAmount > 0) {
        const paidAt = additionalPaymentDate ? new Date(additionalPaymentDate) : new Date()
        await prisma.payment.create({ data: { dealId: id, amount: additionalPaymentAmount, paidAt } })
      }

      // 4. Paymentの合計から paymentAmount を再計算
      const allPayments = await prisma.payment.findMany({ where: { dealId: id } })
      paymentAmount = allPayments.reduce((s, p) => s + p.amount, 0)

      // Paymentが0件かつ paymentAmount が手動入力されていれば1件作成
      if (allPayments.length === 0 && (body.paymentAmount ?? 0) > 0) {
        const paidAt = body.meetingDate ? new Date(body.meetingDate) : new Date()
        await prisma.payment.create({ data: { dealId: id, amount: Math.round(body.paymentAmount), paidAt } })
        paymentAmount = Math.round(body.paymentAmount)
      }
    }

    // 5. 活動イベントの追加・削除
    const newEvents: { type: string; date: string; memo?: string }[] = body.newEvents ?? []
    for (const ev of newEvents) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma as any).dealEvent.create({
        data: { dealId: id, type: ev.type, date: new Date(ev.date), memo: ev.memo ?? null },
      })
    }
    const deletedEventIds: number[] = body.deletedEventIds ?? []
    if (deletedEventIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma as any).dealEvent.deleteMany({ where: { id: { in: deletedEventIds }, dealId: id } })
    }

    // 6. 一部決済が全額に達したら自動でステータスを「成約」に変更
    let status = body.status as string
    if (contractAmount > 0 && paymentAmount >= contractAmount && status === '一部決済') {
      status = '成約'
    }

    const deal = await prisma.deal.update({
      where: { id },
      data: {
        customerName: body.customerName,
        memberId: body.memberId,
        productName: body.productName,
        category: body.category ?? detectCategory(body.productName ?? ''),
        contractAmount,
        paymentAmount,
        remainingAmount: contractAmount - paymentAmount,
        status,
        nextAction: body.nextAction ?? null,
        meetingDate: body.meetingDate ? new Date(body.meetingDate) : null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        notes: body.notes ?? null,
      },
      include: { member: { select: { name: true } } },
    })

    // Paymentが0件かつ paymentAmount が手動入力されていれば1件作成（新規案件用の後方互換）
    if (allPayments.length === 0 && (body.paymentAmount ?? 0) > 0) {
      const paidAt = body.meetingDate ? new Date(body.meetingDate) : (deal.meetingDate ?? new Date())
      await prisma.payment.create({ data: { dealId: id, amount: body.paymentAmount, paidAt } })
    }

    // 通知の更新チェック
    await updateNotifications(id, deal.memberId, deal.customerName, body.dueDate, status)

    return NextResponse.json({ ...deal, memberName: deal.member.name })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to update deal' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)
    await prisma.deal.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to delete deal' }, { status: 500 })
  }
}

const URGENT_STATUSES = ['一部決済', '決済待ち']

// 案件更新時に通知を再生成
async function updateNotifications(
  dealId: number,
  memberId: number,
  customerName: string,
  dueDateStr: string | null,
  status: string
) {
  // 完了案件の通知は削除
  if (status === '完了' || status === '成約') {
    await prisma.notification.deleteMany({ where: { dealId } })
    return
  }

  // 一部決済・決済待ちは期限に関係なく必ず通知を生成・維持
  if (URGENT_STATUSES.includes(status)) {
    const type = status === '一部決済' ? 'partial_payment' : 'payment_pending'
    const message =
      status === '一部決済'
        ? `【一部決済】「${customerName}」案件の残額の回収が未完了です`
        : `【決済待ち】「${customerName}」案件の決済が完了していません`

    const existing = await prisma.notification.findFirst({ where: { dealId } })
    if (existing) {
      await prisma.notification.update({ where: { id: existing.id }, data: { type, message, isRead: false } })
    } else {
      await prisma.notification.create({ data: { dealId, memberId, type, message } })
    }
    return
  }

  // 以降は期限ベースの通知（一部決済・決済待ち以外）
  if (!dueDateStr) return

  const dueDate = new Date(dueDateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  dueDate.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  let type = ''
  let message = ''
  if (diffDays < 0) {
    type = 'overdue'
    message = `【期日超過】「${customerName}」案件の期日を${Math.abs(diffDays)}日超過しています`
  } else if (diffDays === 0) {
    type = 'due_today'
    message = `【期日当日】「${customerName}」案件の期日です`
  } else if (diffDays === 1) {
    type = 'due_1day'
    message = `【明日期日】「${customerName}」案件の期日は明日です`
  } else if (diffDays <= 3) {
    type = 'due_3days'
    message = `【3日以内】「${customerName}」案件の期日まで${diffDays}日です`
  }

  if (type) {
    // 同じ案件の未読通知を更新、なければ作成
    const existing = await prisma.notification.findFirst({ where: { dealId, isRead: false } })
    if (existing) {
      await prisma.notification.update({ where: { id: existing.id }, data: { type, message } })
    } else {
      await prisma.notification.create({ data: { dealId, memberId, type, message } })
    }
  }
}
