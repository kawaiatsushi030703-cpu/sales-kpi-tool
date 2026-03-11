import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 通知を既読にする
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)
    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
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
