'use client'
import Link from 'next/link'
import useSWR from 'swr'
import { usePathname } from 'next/navigation'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Deal {
  id: number
  customerName: string
  status: string
  memberName: string
}

const URGENT_STATUSES = ['一部決済', '決済待ち']

export function UrgentAlert() {
  const pathname = usePathname()
  const { data: deals } = useSWR('/api/deals', fetcher, { refreshInterval: 15000 })

  if (pathname !== '/notifications') return null

  const urgent: Deal[] = Array.isArray(deals)
    ? deals.filter((d: Deal) => URGENT_STATUSES.includes(d.status))
    : []

  if (urgent.length === 0) return null

  const ichibu = urgent.filter(d => d.status === '一部決済')
  const kessai = urgent.filter(d => d.status === '決済待ち')

  return (
    <>
      <Link
        href="/notifications"
        className="fixed top-0 left-0 right-0 z-[300] flex items-center justify-between gap-3 px-4 py-2.5 text-white no-underline"
        style={{
          background: 'linear-gradient(90deg, #b91c1c, #dc2626, #b91c1c)',
          backgroundSize: '200% auto',
          animation: 'alertSlide 2s linear infinite',
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base shrink-0" style={{ animation: 'alertBounce 0.8s ease-in-out infinite alternate' }}>
            🚨
          </span>
          <div className="flex items-center gap-x-3 gap-y-0.5 flex-wrap min-w-0">
            {ichibu.length > 0 && (
              <span className="text-sm font-black whitespace-nowrap">
                一部決済 <span className="text-yellow-200">{ichibu.length}件</span>
              </span>
            )}
            {ichibu.length > 0 && kessai.length > 0 && <span className="text-red-300 text-xs">|</span>}
            {kessai.length > 0 && (
              <span className="text-sm font-black whitespace-nowrap">
                決済待ち <span className="text-yellow-200">{kessai.length}件</span>
              </span>
            )}
          </div>
        </div>

        <span className="text-xs font-bold bg-white text-red-700 px-3 py-1 rounded-full shrink-0 whitespace-nowrap">
          確認する →
        </span>
      </Link>

      <div className="h-10 w-full" aria-hidden />

      <style jsx global>{`
        @keyframes alertSlide {
          0%   { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes alertBounce {
          from { transform: translateY(0); }
          to   { transform: translateY(-3px); }
        }
      `}</style>
    </>
  )
}
