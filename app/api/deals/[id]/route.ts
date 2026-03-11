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
        payments: { orderBy: { paidAt: 'desc' } },
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

    const contractAmount = body.contractAmount ?? 0
    const paymentAmount = body.paymentAmount ?? 0

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
        status: body.status,
        nextAction: body.nextAction ?? null,
        meetingDate: body.meetingDate ? new Date(body.meetingDate) : null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        notes: body.notes ?? null,
      },
      include: { member: { select: { name: true } } },
    })

    // Payment テーブルを同期してKPI計算を正確に保つ
    await prisma.payment.deleteMany({ where: { dealId: id } })
    if (paymentAmount > 0) {
      const paidAt = body.meetingDate ? new Date(body.meetingDate) : (deal.meetingDate ?? new Date())
      await prisma.payment.create({ data: { dealId: id, amount: paymentAmount, paidAt } })
    }

    // 通知の更新チェック
    await updateNotifications(id, deal.memberId, deal.customerName, body.dueDate, body.status)

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

// 案件更新時に通知を再生成
async function updateNotifications(
  dealId: number,
  memberId: number,
  customerName: string,
  dueDateStr: string | null,
  status: string
) {
  // 完了案件の通知は削除
  if (status === '完了') {
    await prisma.notification.deleteMany({ where: { dealId } })
    return
  }

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
