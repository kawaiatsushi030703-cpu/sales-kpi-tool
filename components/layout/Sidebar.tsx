'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FolderKanban, Users, Trophy, Bell, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const navItems = [
  { href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/deals', label: '営業管理', icon: FolderKanban },
  { href: '/members', label: 'メンバー管理', icon: Users },
  { href: '/rankings', label: '着金ランキング', icon: Trophy },
  { href: '/notifications', label: '通知', icon: Bell },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: notifications } = useSWR('/api/notifications', fetcher, { refreshInterval: 30000 })
  const unreadCount = Array.isArray(notifications) ? notifications.filter((n: { isRead: boolean }) => !n.isRead).length : 0

  return (
    <aside className="w-60 bg-gray-900 text-white flex flex-col h-screen sticky top-0 flex-shrink-0">
      {/* ロゴ */}
      <div className="px-5 py-5 border-b border-gray-700">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <TrendingUp size={18} />
          </div>
          <div>
            <p className="font-bold text-sm leading-none">Cチーム</p>
            <p className="text-gray-400 text-xs mt-0.5">ぶち上げ管理</p>
          </div>
        </div>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {item.href === '/notifications' && unreadCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                  {unreadCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* フッター */}
      <div className="px-5 py-4 border-t border-gray-700">
        <p className="text-gray-500 text-xs">© 2024 Sales KPI Tool</p>
      </div>
    </aside>
  )
}
