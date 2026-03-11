import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentMonthRange, getCurrentWeekRange, calcAchievementRate, getWeekNumber, getThursdayWeeks } from '@/lib/utils'

const ANNUAL_TARGETS = {
  総合: 1_000_000_000,
  物販: 300_000_000,
  AI: 700_000_000,
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
    },
  })
}

export async function GET() {
  try {
    const now = new Date()
    const year = now.getFullYear()
    const { start: monthStart, end: monthEnd } = getCurrentMonthRange()
    const { start: weekStart, end: weekEnd } = getCurrentWeekRange()

    // 月間目標
    const monthGoal = await prisma.teamGoal.findFirst({
      where: { periodType: 'monthly', category: '総合', year, month: now.getMonth() + 1 },
    })

    // 週間目標（年間÷52）
    const weekNum = getWeekNumber(now)
    const weekGoal = await prisma.teamGoal.findFirst({
      where: { periodType: 'weekly', category: '総合', year, month: now.getMonth() + 1, week: weekNum },
    })

    // 年間始まりから現在までの全入金
    const yearStart = new Date(year, 0, 1)
    const yearEnd = new Date(year, 11, 31, 23, 59, 59)

    const allPayments = await prisma.payment.findMany({
      where: { paidAt: { gte: yearStart, lte: yearEnd } },
      include: { deal: { select: { memberId: true, category: true } } },
    })

    const annualPayment = allPayments.reduce((sum, p) => sum + p.amount, 0)
    const annualPhysicalPayment = allPayments
      .filter((p) => p.deal.category === '物販')
      .reduce((sum, p) => sum + p.amount, 0)
    const annualAIPayment = allPayments
      .filter((p) => p.deal.category === 'AI')
      .reduce((sum, p) => sum + p.amount, 0)

    // 月間着金（カテゴリ別）
    const monthlyPayments = await prisma.payment.findMany({
      where: { paidAt: { gte: monthStart, lte: monthEnd } },
      include: { deal: { select: { category: true } } },
    })
    const monthlyPayment = monthlyPayments.reduce((sum, p) => sum + p.amount, 0)
    const monthlyBuhan = monthlyPayments.filter(p => p.deal.category === '物販').reduce((sum, p) => sum + p.amount, 0)
    const monthlyAI = monthlyPayments.filter(p => p.deal.category === 'AI').reduce((sum, p) => sum + p.amount, 0)

    // 週間着金（カテゴリ別・今週）
    const weeklyPayments = await prisma.payment.findMany({
      where: { paidAt: { gte: weekStart, lte: weekEnd } },
      include: { deal: { select: { category: true } } },
    })
    const weeklyPayment = weeklyPayments.reduce((sum, p) => sum + p.amount, 0)
    const weeklyBuhan = weeklyPayments.filter(p => p.deal.category === '物販').reduce((sum, p) => sum + p.amount, 0)
    const weeklyAI = weeklyPayments.filter(p => p.deal.category === 'AI').reduce((sum, p) => sum + p.amount, 0)

    // カテゴリ別月間・週間目標
    const monthBuhanGoal = await prisma.teamGoal.findFirst({
      where: { periodType: 'monthly', category: '物販', year, month: now.getMonth() + 1 },
    })
    const monthAIGoal = await prisma.teamGoal.findFirst({
      where: { periodType: 'monthly', category: 'AI', year, month: now.getMonth() + 1 },
    })
    const weekBuhanGoal = await prisma.teamGoal.findFirst({
      where: { periodType: 'weekly', category: '物販', year, month: now.getMonth() + 1, week: weekNum },
    })
    const weekAIGoal = await prisma.teamGoal.findFirst({
      where: { periodType: 'weekly', category: 'AI', year, month: now.getMonth() + 1, week: weekNum },
    })

    // 週間目標 = 年間目標 ÷ 52
    const weeklyTarget = weekGoal?.targetAmount ?? Math.round(ANNUAL_TARGETS.総合 / 52)

    // 月内4週分の集計（木曜始まり）
    const monthPaymentsAll = await prisma.payment.findMany({
      where: { paidAt: { gte: monthStart, lte: monthEnd } },
      include: { deal: { select: { category: true } } },
    })
    const buhanWeekTarget = monthBuhanGoal?.targetAmount ? Math.round(monthBuhanGoal.targetAmount / 4) : Math.round(30_000_000 / 4)
    const aiWeekTarget = monthAIGoal?.targetAmount ? Math.round(monthAIGoal.targetAmount / 4) : Math.round(70_000_000 / 4)
    const thursdayWeeks = getThursdayWeeks(year, now.getMonth() + 1)
    const weeklyBreakdown = thursdayWeeks.map(w => {
      const wPayments = monthPaymentsAll.filter(p => {
        const paidAt = new Date(p.paidAt)
        return paidAt >= w.start && paidAt <= w.end
      })
      const buhanPay = wPayments.filter(p => p.deal.category === '物販').reduce((s, p) => s + p.amount, 0)
      const aiPay    = wPayments.filter(p => p.deal.category === 'AI').reduce((s, p) => s + p.amount, 0)
      const isCurrent = now >= w.start && now <= w.end
      return {
        label: w.label,
        weekNum: w.weekNum,
        isCurrent,
        buhan: { payment: buhanPay, target: buhanWeekTarget, achievementRate: calcAchievementRate(buhanPay, buhanWeekTarget) },
        ai:    { payment: aiPay,    target: aiWeekTarget,    achievementRate: calcAchievementRate(aiPay, aiWeekTarget) },
      }
    })

    // メンバー別統計
    const members = await prisma.member.findMany({
      include: {
        deals: {
          select: { paymentAmount: true, id: true },
        },
      },
    })
    const memberStats = members.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      category: m.category,
      targetAmount: m.targetAmount,
      avatarColor: m.avatarColor,
      paymentAmount: m.deals.reduce((sum, d) => sum + d.paymentAmount, 0),
      achievementRate: calcAchievementRate(
        m.deals.reduce((sum, d) => sum + d.paymentAmount, 0),
        m.targetAmount
      ),
      dealCount: m.deals.length,
    }))

    // 直近の案件
    const recentDeals = await prisma.deal.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: { member: { select: { name: true } } },
    })

    // 期日が近い案件
    const urgentDealDate = new Date()
    urgentDealDate.setDate(urgentDealDate.getDate() + 3)
    const urgentDeals = await prisma.deal.findMany({
      where: {
        status: { notIn: ['完了'] },
        dueDate: { not: null, lte: urgentDealDate },
      },
      orderBy: { dueDate: 'asc' },
      include: { member: { select: { name: true } } },
    })

    return NextResponse.json({
      annual: {
        target: ANNUAL_TARGETS.総合,
        payment: annualPayment,
        achievementRate: calcAchievementRate(annualPayment, ANNUAL_TARGETS.総合),
        buhanTarget: ANNUAL_TARGETS.物販,
        buhanPayment: annualPhysicalPayment,
        buhanRate: calcAchievementRate(annualPhysicalPayment, ANNUAL_TARGETS.物販),
        aiTarget: ANNUAL_TARGETS.AI,
        aiPayment: annualAIPayment,
        aiRate: calcAchievementRate(annualAIPayment, ANNUAL_TARGETS.AI),
      },
      monthly: {
        target: monthGoal?.targetAmount ?? Math.round(ANNUAL_TARGETS.総合 / 12),
        payment: monthlyPayment,
        achievementRate: calcAchievementRate(monthlyPayment, monthGoal?.targetAmount ?? Math.round(ANNUAL_TARGETS.総合 / 12)),
        buhan: {
          target: monthBuhanGoal?.targetAmount ?? 30_000_000,
          payment: monthlyBuhan,
          achievementRate: calcAchievementRate(monthlyBuhan, monthBuhanGoal?.targetAmount ?? 30_000_000),
        },
        ai: {
          target: monthAIGoal?.targetAmount ?? 70_000_000,
          payment: monthlyAI,
          achievementRate: calcAchievementRate(monthlyAI, monthAIGoal?.targetAmount ?? 70_000_000),
        },
      },
      weekly: {
        target: weeklyTarget,
        payment: weeklyPayment,
        achievementRate: calcAchievementRate(weeklyPayment, weeklyTarget),
        buhan: {
          target: weekBuhanGoal?.targetAmount ?? Math.round(30_000_000 / 4),
          payment: weeklyBuhan,
          achievementRate: calcAchievementRate(weeklyBuhan, weekBuhanGoal?.targetAmount ?? Math.round(30_000_000 / 4)),
        },
        ai: {
          target: weekAIGoal?.targetAmount ?? Math.round(70_000_000 / 4),
          payment: weeklyAI,
          achievementRate: calcAchievementRate(weeklyAI, weekAIGoal?.targetAmount ?? Math.round(70_000_000 / 4)),
        },
      },
      weeklyBreakdown,
      members: memberStats,
      recentDeals: recentDeals.map((d) => ({ ...d, memberName: d.member.name })),
      urgentDeals: urgentDeals.map((d) => ({ ...d, memberName: d.member.name })),
    }, { headers: { 'Access-Control-Allow-Origin': '*' } })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
