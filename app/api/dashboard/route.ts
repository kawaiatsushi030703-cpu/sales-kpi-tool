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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const now = new Date()
    const year = parseInt(searchParams.get('year') ?? String(now.getFullYear()))
    const month = parseInt(searchParams.get('month') ?? String(now.getMonth() + 1))

    const monthStart = new Date(year, month - 1, 1)
    const monthEnd = new Date(year, month, 0, 23, 59, 59)
    const { start: weekStart, end: weekEnd } = getCurrentWeekRange()

    // 月間目標
    const monthGoal = await prisma.teamGoal.findFirst({
      where: { periodType: 'monthly', category: '総合', year, month },
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

    const annualPaymentFromDeals = allPayments.reduce((sum, p) => sum + p.amount, 0)
    const annualPhysicalFromDeals = allPayments
      .filter((p) => p.deal.category === '物販')
      .reduce((sum, p) => sum + p.amount, 0)
    const annualAIFromDeals = allPayments
      .filter((p) => p.deal.category === 'AI')
      .reduce((sum, p) => sum + p.amount, 0)

    // 月間着金（カテゴリ別）
    const monthlyPayments = await prisma.payment.findMany({
      where: { paidAt: { gte: monthStart, lte: monthEnd } },
      include: { deal: { select: { category: true } } },
    })
    const monthlyPaymentFromDeals = monthlyPayments.reduce((sum, p) => sum + p.amount, 0)
    const monthlyBuhanFromDeals = monthlyPayments.filter(p => p.deal.category === '物販').reduce((sum, p) => sum + p.amount, 0)
    const monthlyAIFromDeals = monthlyPayments.filter(p => p.deal.category === 'AI').reduce((sum, p) => sum + p.amount, 0)

    // MonthlySummary（売上入力セクションのデータ）も合算
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const monthlySummary = await db.monthlySummary.findUnique({ where: { year_month: { year, month } } })
    const summaryBuhan = monthlySummary?.buhanPayment ?? 0
    const summaryAI    = monthlySummary?.aiPayment    ?? 0
    const summaryBuhanContract = monthlySummary?.buhanContract ?? 0
    const summaryAIContract    = monthlySummary?.aiContract    ?? 0

    const monthlyPayment = monthlyPaymentFromDeals + summaryBuhan + summaryAI
    const monthlyBuhan   = monthlyBuhanFromDeals   + summaryBuhan
    const monthlyAI      = monthlyAIFromDeals       + summaryAI

    // 今月の売上合計（Deal.contractAmount + MonthlySummary）
    const monthlyDeals = await prisma.deal.findMany({
      where: {
        meetingDate: { gte: monthStart, lte: monthEnd },
        status: { in: ['成約', '一部決済', '決済待ち', '完了'] },
      },
      select: { contractAmount: true },
    })
    const contractFromDeals = monthlyDeals.reduce((sum, d) => sum + d.contractAmount, 0)
    const monthlyContractTotal = contractFromDeals + summaryBuhanContract + summaryAIContract

    // 年間のMonthlySummaryを全取得（年間合計・月別内訳用）
    const annualSummaries: Array<{ month: number; buhanPayment: number; aiPayment: number; buhanContract: number; aiContract: number }> =
      await db.monthlySummary.findMany({ where: { year: now.getFullYear() } })

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
      where: { periodType: 'monthly', category: '物販', year, month },
    })
    const monthAIGoal = await prisma.teamGoal.findFirst({
      where: { periodType: 'monthly', category: 'AI', year, month },
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
    const thursdayWeeks = getThursdayWeeks(year, month)
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

    // 月別内訳（年間タブ用）
    const currentYear = now.getFullYear()
    const monthlyBreakdown = await Promise.all(
      Array.from({ length: 12 }, (_, i) => i).map(async (m) => {
        const mStart = new Date(currentYear, m, 1)
        const mEnd = new Date(currentYear, m + 1, 0, 23, 59, 59)
        const mGoal = await prisma.teamGoal.findFirst({
          where: { periodType: 'monthly', category: '総合', year: currentYear, month: m + 1 },
        })
        const mPaymentsFromDeals = allPayments.filter(p => {
          const paidAt = new Date(p.paidAt)
          return paidAt >= mStart && paidAt <= mEnd
        })
        const mPaymentFromDeals = mPaymentsFromDeals.reduce((sum, p) => sum + p.amount, 0)
        const mSummary = annualSummaries.find(s => s.month === m + 1)
        const mPayment = mPaymentFromDeals + (mSummary?.buhanPayment ?? 0) + (mSummary?.aiPayment ?? 0)
        const mTarget = mGoal?.targetAmount ?? Math.round(ANNUAL_TARGETS.総合 / 12)
        return {
          month: m + 1,
          payment: mPayment,
          target: mTarget,
          achievementRate: calcAchievementRate(mPayment, mTarget),
          isFuture: mStart > now,
        }
      })
    )

    // メンバー別統計（当月の着金額ベース）
    const members = await prisma.member.findMany({
      include: {
        deals: { select: { id: true } },
      },
    })

    // 当月の Payment を memberId でグループ集計（選択月）
    const memberMonthlyPayments = await prisma.payment.findMany({
      where: { paidAt: { gte: monthStart, lte: monthEnd } },
      include: { deal: { select: { memberId: true } } },
    })
    const memberPaymentMap = new Map<number, number>()
    for (const p of memberMonthlyPayments) {
      const prev = memberPaymentMap.get(p.deal.memberId) ?? 0
      memberPaymentMap.set(p.deal.memberId, prev + p.amount)
    }

    const memberStats = members.map((m) => {
      const monthlyPayment = memberPaymentMap.get(m.id) ?? 0
      return {
        id: m.id,
        name: m.name,
        email: m.email,
        category: m.category,
        targetAmount: m.targetAmount,
        avatarColor: m.avatarColor,
        paymentAmount: monthlyPayment,
        achievementRate: calcAchievementRate(monthlyPayment, m.targetAmount),
        dealCount: m.deals.length,
      }
    })

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
      annual: (() => {
        const annualSummaryBuhan = annualSummaries.reduce((s, r) => s + r.buhanPayment, 0)
        const annualSummaryAI    = annualSummaries.reduce((s, r) => s + r.aiPayment, 0)
        const annualPayment         = annualPaymentFromDeals  + annualSummaryBuhan + annualSummaryAI
        const annualPhysicalPayment = annualPhysicalFromDeals + annualSummaryBuhan
        const annualAIPayment       = annualAIFromDeals       + annualSummaryAI
        return {
          target: ANNUAL_TARGETS.総合,
          payment: annualPayment,
          achievementRate: calcAchievementRate(annualPayment, ANNUAL_TARGETS.総合),
          buhanTarget: ANNUAL_TARGETS.物販,
          buhanPayment: annualPhysicalPayment,
          buhanRate: calcAchievementRate(annualPhysicalPayment, ANNUAL_TARGETS.物販),
          aiTarget: ANNUAL_TARGETS.AI,
          aiPayment: annualAIPayment,
          aiRate: calcAchievementRate(annualAIPayment, ANNUAL_TARGETS.AI),
          monthlyBreakdown,
        }
      })(),
      monthly: {
        target: monthGoal?.targetAmount ?? Math.round(ANNUAL_TARGETS.総合 / 12),
        payment: monthlyPayment,
        contractTotal: monthlyContractTotal,
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
