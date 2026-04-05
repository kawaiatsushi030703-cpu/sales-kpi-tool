import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const URGENT_STATUSES = ['一部決済', '決済待ち']

// 一部決済・決済待ちの案件に通知レコードが存在しない場合に一括生成
export async function POST() {
  try {
    const urgentDeals = await prisma.deal.findMany({
      where: { status: { in: URGENT_STATUSES } },
      include: { notifications: true },
    })

    let created = 0
    for (const deal of urgentDeals) {
      if (deal.notifications.length === 0) {
        const type = deal.status === '一部決済' ? 'partial_payment' : 'payment_pending'
        const message =
          deal.status === '一部決済'
            ? `【一部決済】「${deal.customerName}」案件の残額の回収が未完了です`
            : `【決済待ち】「${deal.customerName}」案件の決済が完了していません`
        await prisma.notification.create({
          data: { dealId: deal.id, memberId: deal.memberId, type, message },
        })
        created++
      }
    }

    return NextResponse.json({ synced: created })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to sync notifications' }, { status: 500 })
  }
}
