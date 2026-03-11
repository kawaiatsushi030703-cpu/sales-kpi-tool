import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function detectCategory(productName: string): string {
  return /AI|ai|エーアイ/i.test(productName) ? 'AI' : '物販'
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const memberId = searchParams.get('memberId')
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const teamColor = searchParams.get('teamColor')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') ?? 'updatedAt'
    const order = (searchParams.get('order') ?? 'desc') as 'asc' | 'desc'

    const where: Record<string, unknown> = {}
    if (memberId) where.memberId = parseInt(memberId)
    if (status) where.status = status
    if (category) where.category = category
    if (teamColor) {
      const teamMembers = await prisma.member.findMany({ where: { avatarColor: teamColor }, select: { id: true } })
      where.memberId = { in: teamMembers.map((m) => m.id) }
    }
    if (search) {
      where.OR = [
        { customerName: { contains: search } },
        { productName: { contains: search } },
      ]
    }

    const deals = await prisma.deal.findMany({
      where,
      include: { member: { select: { name: true, avatarColor: true } } },
      orderBy: { [sortBy]: order },
    })

    return NextResponse.json(
      deals.map((d) => ({ ...d, memberName: d.member.name, memberColor: d.member.avatarColor }))
    )
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const contractAmount = body.contractAmount ?? 0
    const paymentAmount = body.paymentAmount ?? 0

    const deal = await prisma.deal.create({
      data: {
        customerName: body.customerName,
        memberId: body.memberId,
        productName: body.productName,
        category: body.category ?? detectCategory(body.productName ?? ''),
        contractAmount,
        paymentAmount,
        remainingAmount: contractAmount - paymentAmount,
        status: body.status ?? '後追い',
        nextAction: body.nextAction ?? null,
        meetingDate: body.meetingDate ? new Date(body.meetingDate) : null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        notes: body.notes ?? null,
      },
      include: { member: { select: { name: true } } },
    })

    // 初期入金がある場合はPaymentレコードも作成
    if (paymentAmount > 0) {
      const paidAt = body.meetingDate ? new Date(body.meetingDate) : new Date()
      await prisma.payment.create({
        data: { dealId: deal.id, amount: paymentAmount, paidAt },
      })
    }

    return NextResponse.json({ ...deal, memberName: deal.member.name }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create deal' }, { status: 500 })
  }
}
