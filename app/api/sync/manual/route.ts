import { NextResponse } from 'next/server'

// フロントエンドから呼び出せる同期エンドポイント（シークレット不要）
export async function POST(req: Request) {
  const secret = process.env.SYNC_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'SYNC_SECRET not configured' }, { status: 500 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sales-kpi-tool.vercel.app'

  try {
    const res = await fetch(`${baseUrl}/api/sync/google-sheets`, {
      method: 'POST',
      headers: { 'x-sync-secret': secret },
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
