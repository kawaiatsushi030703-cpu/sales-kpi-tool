import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calcAchievementRate, getThursdayWeeks, getWeekNumber } from '@/lib/utils'
import { startOfWeek, endOfWeek } from 'date-fns'

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

    const now = new Date()
    const year  = parseInt(searchParams.get('year')  ?? String(now.getFullYear()))
    const month = parseInt(searchParams.get('month') ?? String(now.getMonth() + 1))
    // week: 1〜4（週間モード用）
    const weekParam = searchParams.get('week')
    const week = weekParam ? parseInt(weekParam) : null

    const members = await prisma.member.findMany()
    const dealWhere = category !== '総合' ? { category } : {}
    const memberPayments: Record<number, number> = {}

    if (period === 'monthly') {
      const start = new Date(year, month - 1, 1)
      const end   = new Date(year, month, 0, 23, 59, 59)
      const payments = await prisma.payment.findMany({
        where: { paidAt: { gte: start, lte: end }, deal: dealWhere },
        include: { deal: { select: { memberId: true } } },
      })
      for (const p of payments) {
        const mid = p.deal.memberId
        memberPayments[mid] = (memberPayments[mid] ?? 0) + p.amount
      }
    } else if (period === 'weekly') {
      let start: Date, end: Date
      if (week !== null) {
        // 指定月の週番号から日付範囲を算出（木曜始まり）
        const weeks = getThursdayWeeks(year, month)
        const w = weeks[(week - 1) % weeks.length]
        start = w.start
        end   = w.end
      } else {
        start = startOfWeek(now, { weekStartsOn: 4 })
        end   = endOfWeek(now, { weekStartsOn: 4 })
      }
      const payments = await prisma.payment.findMany({
        where: { paidAt: { gte: start, lte: end }, deal: dealWhere },
        include: { deal: { select: { memberId: true } } },
      })
      for (const p of payments) {
        const mid = p.deal.memberId
        memberPayments[mid] = (memberPayments[mid] ?? 0) + p.amount
      }
    } else {
      const deals = await prisma.deal.findMany({
        where: dealWhere,
        select: { memberId: true, paymentAmount: true },
      })
      for (const d of deals) {
        memberPayments[d.memberId] = (memberPayments[d.memberId] ?? 0) + d.paymentAmount
      }
    }

    let teamTarget = ANNUAL_TARGETS[category] ?? ANNUAL_TARGETS['総合']
    if (period === 'monthly') {
      const goal = await prisma.teamGoal.findFirst({
        where: { periodType: 'monthly', category, year, month },
      })
      teamTarget = goal?.targetAmount ?? Math.round(teamTarget / 12)
    } else if (period === 'weekly') {
      const weekNum = week ?? getWeekNumber(now)
      const weekGoal = await prisma.teamGoal.findFirst({
        where: { periodType: 'weekly', category, year, month, week: weekNum },
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
