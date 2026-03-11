import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getWeekNumber } from '@/lib/utils'

export async function GET() {
  try {
    const goals = await prisma.teamGoal.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(goals)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch team goals' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const now = new Date()
    const weekNum = getWeekNumber(now)

    const goal = await prisma.teamGoal.upsert({
      where: {
        periodType_year_month_week: {
          periodType: body.periodType,
          year: body.year ?? now.getFullYear(),
          month: body.month ?? (body.periodType === 'monthly' ? now.getMonth() + 1 : now.getMonth() + 1),
          week: body.week ?? (body.periodType === 'weekly' ? weekNum : 0),
        },
      },
      update: { targetAmount: body.targetAmount },
      create: {
        periodType: body.periodType,
        year: body.year ?? now.getFullYear(),
        month: body.month ?? now.getMonth() + 1,
        week: body.week ?? (body.periodType === 'weekly' ? weekNum : 0),
        targetAmount: body.targetAmount,
      },
    })
    return NextResponse.json(goal)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to save team goal' }, { status: 500 })
  }
}
