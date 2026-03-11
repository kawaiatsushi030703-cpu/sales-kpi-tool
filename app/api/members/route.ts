import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calcAchievementRate } from '@/lib/utils'

export async function GET() {
  try {
    const members = await prisma.member.findMany({
      include: {
        deals: {
          select: { paymentAmount: true, status: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    const result = members.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      targetAmount: m.targetAmount,
      avatarColor: m.avatarColor,
      paymentAmount: m.deals.reduce((sum, d) => sum + d.paymentAmount, 0),
      achievementRate: calcAchievementRate(
        m.deals.reduce((sum, d) => sum + d.paymentAmount, 0),
        m.targetAmount
      ),
      dealCount: m.deals.length,
      createdAt: m.createdAt,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // メールアドレスは自動生成（UI非表示のため）
    const email = `member_${Date.now()}_${Math.random().toString(36).slice(2)}@internal.local`
    const member = await prisma.member.create({
      data: {
        name: body.name,
        email,
        targetAmount: body.targetAmount ?? 0,
        avatarColor: body.avatarColor ?? '#6366f1',
      },
    })
    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create member' }, { status: 500 })
  }
}
