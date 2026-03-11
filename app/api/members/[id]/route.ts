import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calcAchievementRate } from '@/lib/utils'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)
    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        deals: {
          include: { payments: true },
          orderBy: { updatedAt: 'desc' },
        },
      },
    })

    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    const paymentAmount = member.deals.reduce((sum, d) => sum + d.paymentAmount, 0)
    return NextResponse.json({
      ...member,
      paymentAmount,
      achievementRate: calcAchievementRate(paymentAmount, member.targetAmount),
      dealCount: member.deals.length,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch member' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)
    const body = await req.json()
    const member = await prisma.member.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        targetAmount: body.targetAmount,
        avatarColor: body.avatarColor,
      },
    })
    return NextResponse.json(member)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)
    await prisma.member.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 })
  }
}
