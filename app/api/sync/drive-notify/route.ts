import { NextRequest, NextResponse } from 'next/server'

// Google Drive Push Notification を受け取り、スプシ → DBへ自動同期するエンドポイント
export async function POST(req: NextRequest) {
  const state = req.headers.get('x-goog-resource-state')

  // Google の疎通確認 (sync) は 200 で返すだけ
  if (state === 'sync') {
    return new NextResponse(null, { status: 200 })
  }

  // ファイルが更新されたとき (update / change)
  if (state === 'update' || state === 'change') {
    const secret = process.env.SYNC_SECRET
    if (!secret) return new NextResponse(null, { status: 500 })

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sales-kpi-tool.vercel.app'

    // 内部の sync エンドポイントを呼び出す（非同期：レスポンスを待たない）
    fetch(`${baseUrl}/api/sync/google-sheets`, {
      method: 'POST',
      headers: { 'x-sync-secret': secret },
    }).catch((e) => console.error('[drive-notify] sync error:', e))
  }

  return new NextResponse(null, { status: 200 })
}

// Google の channel verification 用 GET
export async function GET() {
  return new NextResponse('OK', { status: 200 })
}
