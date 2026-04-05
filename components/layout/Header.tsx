'use client'
import React from 'react'
import { Bell, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface HeaderProps {
  title: string
  subtitle?: string
  children?: React.ReactNode
}

export function Header({ title, subtitle, children }: HeaderProps) {
  const { data: notifications } = useSWR('/api/notifications', fetcher, { refreshInterval: 30000 })
  const unreadCount = Array.isArray(notifications) ? notifications.filter((n: { isRead: boolean }) => !n.isRead).length : 0

  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between sticky top-0 z-10">
      {/* モバイル: ロゴ + タイトル */}
      <div className="flex items-center gap-3">
        <div className="md:hidden w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <TrendingUp size={14} className="text-white" />
        </div>
        <div>
          <h1 className="text-base md:text-xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-xs text-gray-500 hidden sm:block">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {children}
      <Link href="/notifications" className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Link>
      </div>
    </header>
  )
}
