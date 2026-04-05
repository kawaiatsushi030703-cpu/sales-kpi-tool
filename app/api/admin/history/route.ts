import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const year  = parseInt(searchParams.get('year')  ?? String(new Date().getFullYear()))
    const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1))

    const start = new Date(year, month - 1, 1)
    const end   = new Date(year, month, 0, 23, 59, 59)

    // 当月の全 Payment
    const payments = await prisma.payment.findMany({
      where: { paidAt: { gte: start, lte: end } },
      include: {
        deal: {
          select: {
            customerName: true,
            productName: true,
            contractAmount: true,
            category: true,
            status: true,
            memberId: true,
            member: { select: { name: true, avatarColor: true } },
          },
        },
      },
      orderBy: { paidAt: 'desc' },
    })

    // 当月に meetingDate がある全案件（成約）
    const deals = await prisma.deal.findMany({
      where: {
        meetingDate: { gte: start, lte: end },
        status: { in: ['成約', '一部決済', '決済待ち'] },
      },
      include: { member: { select: { name: true, avatarColor: true } } },
      orderBy: { meetingDate: 'desc' },
    })

    // メンバー別集計
    const members = await prisma.member.findMany()
    const memberStats = members.map((m) => {
      const memberPayments = payments.filter((p) => p.deal.memberId === m.id)
      const totalPayment = memberPayments.reduce((s, p) => s + p.amount, 0)
      const dealCount = [...new Set(memberPayments.map((p) => p.dealId))].length
      return {
        id: m.id,
        name: m.name,
        avatarColor: m.avatarColor,
        targetAmount: m.targetAmount,
        paymentAmount: totalPayment,
        achievementRate: m.targetAmount > 0 ? Math.round(totalPayment / m.targetAmount * 100) : 0,
        dealCount,
      }
    }).filter((m) => m.paymentAmount > 0 || m.targetAmount > 0)

    const totalPayment = payments.reduce((s, p) => s + p.amount, 0)
    const buhanPayment = payments.filter((p) => p.deal.category === '物販').reduce((s, p) => s + p.amount, 0)
    const aiPayment    = payments.filter((p) => p.deal.category === 'AI').reduce((s, p) => s + p.amount, 0)

    return NextResponse.json({
      year, month,
      summary: { totalPayment, buhanPayment, aiPayment, paymentCount: payments.length, dealCount: deals.length },
      memberStats,
      payments: payments.map((p) => ({
        id: p.id,
        dealId: p.dealId,
        amount: p.amount,
        paidAt: p.paidAt,
        customerName: p.deal.customerName,
        productName: p.deal.productName,
        contractAmount: p.deal.contractAmount,
        category: p.deal.category,
        status: p.deal.status,
        memberName: p.deal.member.name,
        memberColor: p.deal.member.avatarColor,
      })),
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
  }
}
