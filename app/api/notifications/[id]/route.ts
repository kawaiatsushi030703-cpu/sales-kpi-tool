import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const PROTECTED_STATUSES = ['一部決済', '決済待ち']

// 通知の既読状態をトグル
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)
    const current = await prisma.notification.findUnique({ where: { id } })
    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: !current?.isRead },
    })
    return NextResponse.json(notification)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
  }
}

// 通知を削除
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)
    const isAdmin = req.headers.get('X-Admin-Override') === 'true'

    if (!isAdmin) {
      const notification = await prisma.notification.findUnique({
        where: { id },
        include: { deal: { select: { status: true } } },
      })
      if (notification?.deal && PROTECTED_STATUSES.includes(notification.deal.status)) {
        return NextResponse.json({ error: 'この通知は削除できません' }, { status: 403 })
      }
    }

    await prisma.notification.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 })
  }
}
