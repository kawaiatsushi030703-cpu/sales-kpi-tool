'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FolderKanban, Users, Trophy, Bell, TrendingUp, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const navItems = [
  { href: '/dashboard',     label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/deals',         label: '営業管理',       icon: FolderKanban },
  { href: '/dashboard/members',       label: 'メンバー',       icon: Users },
  { href: '/rankings',      label: 'ランキング',     icon: Trophy },
  { href: '/team-goals',    label: '目標設定',       icon: Settings },
  { href: '/notifications', label: '通知',           icon: Bell },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: notifications } = useSWR('/api/notifications', fetcher, { refreshInterval: 30000 })

  if (pathname.startsWith('/public')) return null
  const unreadCount = Array.isArray(notifications) ? notifications.filter((n: { isRead: boolean }) => !n.isRead).length : 0

  return (
    <>
      {/* PC: 左サイドバー */}
      <aside className="hidden md:flex w-56 bg-gray-900 text-white flex-col h-screen sticky top-0 flex-shrink-0">
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
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
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
        <div className="px-5 py-4 border-t border-gray-700">
          <p className="text-gray-500 text-xs">© 2025 Cチーム</p>
        </div>
      </aside>

      {/* モバイル: 下部ナビ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700 flex">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors relative',
                isActive ? 'text-indigo-400' : 'text-gray-500'
              )}
            >
              <div className="relative">
                <Icon size={22} />
                {item.href === '/notifications' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center leading-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-xs">{item.label}</span>
              {isActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-indigo-400 rounded-full" />}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
