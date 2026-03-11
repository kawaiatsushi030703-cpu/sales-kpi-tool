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
    const period = searchParams.get('period') ?? 'monthly' // monthly | weekly | all
    const category = searchParams.get('category') ?? '総合' // 総合 | 物販 | AI

    const members = await prisma.member.findMany({
      where: category !== '総合' ? { category } : undefined,
      include: { deals: true },
    })

    let rankingData: {
      memberId: number
      memberName: string
      avatarColor: string
      category: string
      targetAmount: number
      paymentAmount: number
    }[] = []

    if (period === 'all') {
      rankingData = members.map((m) => ({
        memberId: m.id,
        memberName: m.name,
        avatarColor: m.avatarColor,
        category: m.category,
        targetAmount: m.targetAmount,
        paymentAmount: m.deals.reduce((sum, d) => sum + d.paymentAmount, 0),
      }))
    } else if (period === 'monthly') {
      const { start, end } = getCurrentMonthRange()
      const payments = await prisma.payment.findMany({
        where: { paidAt: { gte: start, lte: end } },
        include: { deal: { select: { memberId: true } } },
      })
      const memberPayments: Record<number, number> = {}
      for (const p of payments) {
        const mid = p.deal.memberId
        memberPayments[mid] = (memberPayments[mid] ?? 0) + p.amount
      }
      rankingData = members.map((m) => ({
        memberId: m.id,
        memberName: m.name,
        avatarColor: m.avatarColor,
        category: m.category,
        targetAmount: m.targetAmount,
        paymentAmount: memberPayments[m.id] ?? 0,
      }))
    } else if (period === 'weekly') {
      const { start, end } = getCurrentWeekRange()
      const payments = await prisma.payment.findMany({
        where: { paidAt: { gte: start, lte: end } },
        include: { deal: { select: { memberId: true } } },
      })
      const memberPayments: Record<number, number> = {}
      for (const p of payments) {
        const mid = p.deal.memberId
        memberPayments[mid] = (memberPayments[mid] ?? 0) + p.amount
      }
      // 週間個人目標 = 月間目標 / 4
      rankingData = members.map((m) => ({
        memberId: m.id,
        memberName: m.name,
        avatarColor: m.avatarColor,
        category: m.category,
        targetAmount: Math.round(m.targetAmount / 4),
        paymentAmount: memberPayments[m.id] ?? 0,
      }))
    }

    // チーム合計を計算
    const teamTotal = rankingData.reduce((sum, m) => sum + m.paymentAmount, 0)
    const now2 = new Date()

    // DBからチーム目標を取得
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

    // 着金額でソートしてランク付け
    const sorted = rankingData
      .sort((a, b) => b.paymentAmount - a.paymentAmount)
      .map((item, index) => ({
        rank: index + 1,
        ...item,
        achievementRate: calcAchievementRate(item.paymentAmount, item.targetAmount),
        gapToNext: index > 0
          ? rankingData.sort((a, b) => b.paymentAmount - a.paymentAmount)[index - 1].paymentAmount - item.paymentAmount
          : 0,
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
