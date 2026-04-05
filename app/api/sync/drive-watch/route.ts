import { NextResponse } from 'next/server'

const SPREADSHEET_ID = '1G35llv5W0EcJejs4XwBGQap5SgctlBkvUAIiRhuxo3s'
const CHANNEL_ID = 'kpi-drive-sync-v1'
const NOTIFY_URL = 'https://sales-kpi-tool.vercel.app/api/sync/drive-notify'

async function getAccessToken(): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
      grant_type:    'refresh_token',
    }),
  })
  const data = await res.json()
  if (!data.access_token) throw new Error('token refresh failed: ' + JSON.stringify(data))
  return data.access_token
}

// Drive Push Notification チャンネルを登録/更新
export async function POST() {
  try {
    const accessToken = await getAccessToken()

    // 7日後の期限 (Drive watchの最大)
    const expiration = Date.now() + 7 * 24 * 60 * 60 * 1000

    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${SPREADSHEET_ID}/watch`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id:         CHANNEL_ID,
          type:       'web_hook',
          address:    NOTIFY_URL,
          expiration: expiration.toString(),
        }),
      }
    )

    const data = await res.json()

    if (!res.ok) {
      console.error('[drive-watch] registration failed:', data)
      return NextResponse.json({ error: data }, { status: res.status })
    }

    console.log('[drive-watch] registered:', data)
    return NextResponse.json({
      success: true,
      channelId: data.id,
      resourceId: data.resourceId,
      expiration: new Date(parseInt(data.expiration)).toISOString(),
    })
  } catch (e) {
    console.error('[drive-watch] error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: 'POST to register Drive watch channel' })
}
