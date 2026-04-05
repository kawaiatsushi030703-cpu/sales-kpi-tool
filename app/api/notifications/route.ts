import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const memberIdParam = searchParams.get('memberId')
    const memberId = memberIdParam ? parseInt(memberIdParam) : undefined

    const notifications = await prisma.notification.findMany({
      where: memberId ? { memberId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        deal: {
          select: {
            customerName: true,
            status: true,
            dueDate: true,
            memberId: true,
            member: { select: { name: true, avatarColor: true } },
          },
        },
        member: { select: { name: true } },
      },
    })
    return NextResponse.json(notifications)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}
