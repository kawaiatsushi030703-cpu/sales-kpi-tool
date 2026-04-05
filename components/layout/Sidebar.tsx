'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Trophy, Bell, Settings, ShieldCheck, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import useSWR from 'swr'
import { useEffect, useState } from 'react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const navItems = [
  { href: '/dashboard',         label: 'ダッシュボード',    sublabel: 'Dashboard',     icon: LayoutDashboard },
  { href: '/deals',             label: 'Sales Management', sublabel: '案件・商談管理',  icon: null },
  { href: '/dashboard/members', label: 'メンバー管理',      sublabel: 'Members',        icon: Users },
  { href: '/rankings',          label: 'ランキング',         sublabel: 'Rankings',      icon: Trophy },
  { href: '/notifications',     label: 'アラート通知',       sublabel: 'Alerts',        icon: Bell },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: notifications } = useSWR('/api/notifications', fetcher, { refreshInterval: 30000 })
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    setIsAdmin(localStorage.getItem('adminMode') === 'true')
  }, [])

  if (pathname.startsWith('/public')) return null

  const unreadCount = Array.isArray(notifications)
    ? notifications.filter((n: { isRead: boolean }) => !n.isRead).length
    : 0

  return (
    <>
      {/* PC: 左サイドバー */}
      <aside className="hidden md:flex w-56 bg-gray-950 text-white flex-col h-screen sticky top-0 flex-shrink-0 border-r border-gray-800">
        {/* ロゴ */}
        <div className="px-5 py-5 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
              <TrendingUp size={16} />
            </div>
            <div>
              <p className="font-bold text-sm leading-none text-white">Cチーム</p>
              <p className="text-gray-500 text-xs mt-0.5">ぶち上げ管理</p>
            </div>
          </div>
        </div>

        {/* ナビゲーション */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.href === '/dashboard'
              ? pathname === '/dashboard' || (pathname.startsWith('/dashboard') && !pathname.startsWith('/dashboard/members'))
              : pathname.startsWith(item.href)

            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                )}
              >
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  {Icon
                    ? <Icon size={16} />
                    : <span className="text-[10px] font-black text-current leading-none">SM</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="leading-none truncate">{item.label}</p>
                  {item.sublabel && (
                    <p className={`text-[10px] mt-0.5 leading-none truncate ${isActive ? 'text-indigo-200' : 'text-gray-600'}`}>
                      {item.sublabel}
                    </p>
                  )}
                </div>
                {item.href === '/notifications' && unreadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center leading-none">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )
          })}

          <Link href="/admin"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mt-2',
              pathname.startsWith('/admin')
                ? 'bg-red-700 text-white'
                : 'text-red-400 hover:bg-gray-800 hover:text-red-300'
            )}
          >
            <ShieldCheck size={16} className="shrink-0" />
            <span>管理者画面</span>
          </Link>
        </nav>

        <div className="px-5 py-4 border-t border-gray-800">
          <p className="text-gray-600 text-xs">© 2025 Cチーム</p>
        </div>
      </aside>

      {/* モバイル: 下部ナビ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-950 border-t border-gray-800 flex">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)

          return (
            <Link key={item.href} href={item.href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors relative',
                isActive ? 'text-indigo-400' : 'text-gray-600'
              )}
            >
              <div className="relative">
                {Icon
                  ? <Icon size={20} />
                  : <span className="text-[9px] font-black leading-none">SM</span>
                }
                {item.href === '/notifications' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center leading-none font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-medium leading-tight text-center">{item.label}</span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-indigo-400 rounded-full" />
              )}
            </Link>
          )
        })}
        <Link href="/admin"
          className={cn(
            'flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors relative',
            pathname.startsWith('/admin') ? 'text-red-400' : 'text-gray-600'
          )}
        >
          <ShieldCheck size={20} />
          <span className="text-[9px] font-medium leading-tight">管理者</span>
          {pathname.startsWith('/admin') && (
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-red-400 rounded-full" />
          )}
        </Link>
      </nav>
    </>
  )
}
