import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function detectCategory(productName: string): string {
  return /AI|ai|エーアイ/i.test(productName) ? 'AI' : '物販'
}

export async function POST() {
  try {
    const deals = await prisma.deal.findMany({ select: { id: true, productName: true } })
    const updates = await Promise.all(
      deals.map((d) =>
        prisma.deal.update({
          where: { id: d.id },
          data: { category: detectCategory(d.productName) },
        })
      )
    )
    const aiCount = updates.filter((d) => d.category === 'AI').length
    const buhanCount = updates.filter((d) => d.category === '物販').length
    return NextResponse.json({ updated: updates.length, ai: aiCount, buhan: buhanCount })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fix categories' }, { status: 500 })
  }
}
