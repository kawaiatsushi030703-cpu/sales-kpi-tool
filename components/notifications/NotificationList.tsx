'use client'
import { formatDate } from '@/lib/utils'
import { NOTIFICATION_COLORS, NOTIFICATION_LABELS, NotificationType } from '@/types'
import { X, Bell } from 'lucide-react'

interface Notification {
  id: number
  type: string
  message: string
  isRead: boolean
  createdAt: string
  deal: {
    customerName: string
    status: string
    dueDate: string | null
  }
  member: { name: string } | null
}

interface Props {
  notifications: Notification[]
  onMarkRead: (id: number) => void
  onDelete: (id: number) => void
}

export function NotificationList({ notifications, onMarkRead, onDelete }: Props) {
  if (notifications.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <Bell size={40} className="mx-auto mb-3 opacity-30" />
        <p>通知はありません</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {notifications.map((n) => {
        const colorClass = NOTIFICATION_COLORS[n.type as NotificationType] ?? 'bg-gray-100 text-gray-700 border-gray-300'
        const label = NOTIFICATION_LABELS[n.type as NotificationType] ?? n.type
        return (
          <div
            key={n.id}
            className={`flex items-start gap-3 p-4 rounded-xl border transition-opacity ${
              n.isRead ? 'opacity-40 bg-gray-50 border-gray-100' : 'bg-white shadow-sm border-gray-200'
            }`}
          >
            {/* チェックボックス */}
            <button
              onClick={() => onMarkRead(n.id)}
              className={`shrink-0 mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                n.isRead
                  ? 'bg-emerald-500 border-emerald-500 hover:bg-emerald-600'
                  : 'border-gray-300 hover:border-emerald-400 bg-white'
              }`}
              title={n.isRead ? 'チェックを外す' : '対応済みにする'}
            >
              {n.isRead && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            {/* タイプバッジ */}
            <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-bold border ${colorClass}`}>
              {label}
            </span>

            {/* 内容 */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${n.isRead ? 'text-gray-400 line-through' : 'text-gray-800 font-medium'}`}>
                {n.message}
              </p>
              <div className="flex gap-3 mt-1 text-xs text-gray-400">
                <span>{n.deal.customerName}</span>
                <span>ステータス: {n.deal.status}</span>
                {n.deal.dueDate && <span>期日: {formatDate(n.deal.dueDate)}</span>}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{formatDate(n.createdAt)}</p>
            </div>

            {/* 削除ボタン */}
            <button
              onClick={() => onDelete(n.id)}
              className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors shrink-0"
              title="削除"
            >
              <X size={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
