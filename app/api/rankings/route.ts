import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calcAchievementRate, getCurrentMonthRange, getCurrentWeekRange, getWeekNumber } from '@/lib/utils'

const ANNUAL_TARGETS: Record<string, number> = {
  総合: 1_000_000_000,
  物販: 300_000_000,
  AI: 700_000_000,
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') ?? 'monthly'
    const category = searchParams.get('category') ?? '総合'

    const members = await prisma.member.findMany()

    // カテゴリフィルター: deal.categoryで絞り込む
    const dealWhere = category !== '総合' ? { category } : {}

    const memberPayments: Record<number, number> = {}

    if (period === 'monthly') {
      const { start, end } = getCurrentMonthRange()
      const payments = await prisma.payment.findMany({
        where: { paidAt: { gte: start, lte: end }, deal: dealWhere },
        include: { deal: { select: { memberId: true } } },
      })
      for (const p of payments) {
        const mid = p.deal.memberId
        memberPayments[mid] = (memberPayments[mid] ?? 0) + p.amount
      }
    } else if (period === 'weekly') {
      const { start, end } = getCurrentWeekRange()
      const payments = await prisma.payment.findMany({
        where: { paidAt: { gte: start, lte: end }, deal: dealWhere },
        include: { deal: { select: { memberId: true } } },
      })
      for (const p of payments) {
        const mid = p.deal.memberId
        memberPayments[mid] = (memberPayments[mid] ?? 0) + p.amount
      }
    } else {
      // all: deal.paymentAmountを直接集計
      const deals = await prisma.deal.findMany({
        where: dealWhere,
        select: { memberId: true, paymentAmount: true },
      })
      for (const d of deals) {
        memberPayments[d.memberId] = (memberPayments[d.memberId] ?? 0) + d.paymentAmount
      }
    }

    const now2 = new Date()
    let teamTarget = ANNUAL_TARGETS[category] ?? ANNUAL_TARGETS['総合']
    if (period === 'monthly') {
      const goal = await prisma.teamGoal.findFirst({
        where: { periodType: 'monthly', category, year: now2.getFullYear(), month: now2.getMonth() + 1 },
      })
      teamTarget = goal?.targetAmount ?? Math.round(teamTarget / 12)
    } else if (period === 'weekly') {
      const weekGoal = await prisma.teamGoal.findFirst({
        where: { periodType: 'weekly', category, year: now2.getFullYear(), month: now2.getMonth() + 1, week: getWeekNumber(now2) },
      })
      teamTarget = weekGoal?.targetAmount ?? Math.round(teamTarget / 52)
    }

    const rankingData = members.map((m) => ({
      memberId: m.id,
      memberName: m.name,
      avatarColor: m.avatarColor,
      targetAmount: period === 'weekly' ? Math.round(m.targetAmount / 4) : m.targetAmount,
      paymentAmount: memberPayments[m.id] ?? 0,
    }))

    const teamTotal = rankingData.reduce((sum, m) => sum + m.paymentAmount, 0)

    const sorted = rankingData
      .sort((a, b) => b.paymentAmount - a.paymentAmount)
      .map((item, index, arr) => ({
        rank: index + 1,
        ...item,
        achievementRate: calcAchievementRate(item.paymentAmount, item.targetAmount),
        gapToNext: index > 0 ? arr[index - 1].paymentAmount - item.paymentAmount : 0,
      }))

    return NextResponse.json({
      rankings: sorted,
      teamTotal,
      teamTarget,
      teamAchievementRate: calcAchievementRate(teamTotal, teamTarget),
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch rankings' }, { status: 500 })
  }
}
