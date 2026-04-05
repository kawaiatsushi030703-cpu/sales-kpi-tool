import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const year  = parseInt(searchParams.get('year')  ?? String(new Date().getFullYear()))
    const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1))

    const summary = await db.monthlySummary.findUnique({ where: { year_month: { year, month } } })
    return NextResponse.json(summary ?? { year, month, buhanContract: 0, buhanPayment: 0, aiContract: 0, aiPayment: 0 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { year, month, buhanContract, buhanPayment, aiContract, aiPayment, notes } = body

    const now = new Date().toISOString()
    const existing = await db.monthlySummary.findUnique({ where: { year_month: { year, month } } })

    let record
    if (existing) {
      record = await db.monthlySummary.update({
        where: { year_month: { year, month } },
        data: { buhanContract, buhanPayment, aiContract, aiPayment, notes: notes ?? null, updatedAt: now },
      })
    } else {
      record = await db.monthlySummary.create({
        data: { year, month, buhanContract, buhanPayment, aiContract, aiPayment, notes: notes ?? null, createdAt: now, updatedAt: now },
      })
    }
    return NextResponse.json(record)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
