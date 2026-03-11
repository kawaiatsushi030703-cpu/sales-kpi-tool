import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
    await prisma.notification.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 })
  }
}
