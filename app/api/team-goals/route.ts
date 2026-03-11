import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
    const category = body.category ?? '総合'

    const goal = await prisma.teamGoal.upsert({
      where: {
        periodType_category_year_month_week: {
          periodType: body.periodType,
          category,
          year: body.year ?? now.getFullYear(),
          month: body.month ?? now.getMonth() + 1,
          week: body.week ?? 0,
        },
      },
      update: { targetAmount: body.targetAmount },
      create: {
        periodType: body.periodType,
        category,
        year: body.year ?? now.getFullYear(),
        month: body.month ?? now.getMonth() + 1,
        week: body.week ?? 0,
        targetAmount: body.targetAmount,
      },
    })
    return NextResponse.json(goal)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to save team goal' }, { status: 500 })
  }
}
