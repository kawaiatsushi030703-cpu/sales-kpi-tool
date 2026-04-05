'use client'
import { formatDate } from '@/lib/utils'
import { NOTIFICATION_COLORS, NOTIFICATION_LABELS, NotificationType } from '@/types'
import { X, Bell, AlertTriangle } from 'lucide-react'

const PROTECTED_STATUSES = ['一部決済', '決済待ち']

const STATUS_BADGE: Record<string, string> = {
  '一部決済': 'bg-orange-100 text-orange-700 border border-orange-300',
  '決済待ち': 'bg-red-100 text-red-700 border border-red-300',
}

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
    member: { name: string; avatarColor: string } | null
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
        <p className="font-medium">通知はありません</p>
      </div>
    )
  }

  const pinned   = notifications.filter(n => PROTECTED_STATUSES.includes(n.deal?.status))
  const unpinned = notifications.filter(n => !PROTECTED_STATUSES.includes(n.deal?.status))
    .sort((a, b) => Number(a.isRead) - Number(b.isRead))

  // メンバー別にグループ化
  const grouped = pinned.reduce<Record<string, { memberName: string; color: string; items: Notification[] }>>((acc, n) => {
    const name = n.member?.name ?? n.deal.member?.name ?? '未設定'
    const color = n.deal.member?.avatarColor ?? '#6b7280'
    if (!acc[name]) acc[name] = { memberName: name, color, items: [] }
    acc[name].items.push(n)
    return acc
  }, {})

  return (
    <div className="space-y-4">

      {/* ════ 要確認ゾーン：メンバー別グループ ════ */}
      {pinned.length > 0 && (
        <div className="space-y-3">
          {/* セクションヘッダー */}
          <div className="flex items-center gap-2 px-1">
            <AlertTriangle size={14} className="text-red-500 shrink-0" />
            <p className="text-sm font-black text-red-600 tracking-wide">要対応</p>
            <span className="bg-red-500 text-white text-xs font-black rounded-full px-2 py-0.5 ml-0.5">
              {pinned.length}件
            </span>
          </div>

          {Object.values(grouped).map(({ memberName, color, items }) => {
            const ichibu = items.filter(n => n.deal.status === '一部決済')
            const kessai = items.filter(n => n.deal.status === '決済待ち')

            return (
              <div key={memberName} className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                {/* メンバーヘッダー */}
                <div className="flex items-center gap-3 px-4 py-2.5" style={{ backgroundColor: color + '18' }}>
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    {memberName.charAt(0)}
                  </span>
                  <span className="font-bold text-gray-900 text-sm flex-1">{memberName}</span>
                  <div className="flex gap-1.5 text-xs">
                    {ichibu.length > 0 && (
                      <span className="bg-orange-100 text-orange-700 border border-orange-200 rounded-full px-2 py-0.5 font-bold">
                        一部決済 {ichibu.length}件
                      </span>
                    )}
                    {kessai.length > 0 && (
                      <span className="bg-red-100 text-red-700 border border-red-200 rounded-full px-2 py-0.5 font-bold">
                        決済待ち {kessai.length}件
                      </span>
                    )}
                  </div>
                </div>

                {/* 案件リスト */}
                <div className="divide-y divide-gray-100 bg-white">
                  {items.map((n) => (
                    <div key={n.id} className="flex items-center gap-3 px-4 py-3">
                      {/* 既読チェック */}
                      <button
                        onClick={() => onMarkRead(n.id)}
                        className={`shrink-0 w-4.5 h-4.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          n.isRead
                            ? 'bg-emerald-500 border-emerald-500'
                            : 'border-gray-300 bg-white hover:border-emerald-400'
                        }`}
                      >
                        {n.isRead && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>

                      {/* ステータス */}
                      <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_BADGE[n.deal.status] ?? 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                        {n.deal.status}
                      </span>

                      {/* 顧客名 */}
                      <span className="flex-1 text-sm font-semibold text-gray-900 truncate">
                        {n.deal.customerName}
                      </span>

                      {/* 期日 */}
                      {n.deal.dueDate ? (
                        <span className="text-xs text-gray-400 shrink-0">{formatDate(n.deal.dueDate)}</span>
                      ) : (
                        <span className="text-xs text-gray-300 shrink-0">期日なし</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ════ 通常通知 ════ */}
      {unpinned.length > 0 && (
        <div className="space-y-2">
          {pinned.length > 0 && (
            <p className="text-xs text-gray-400 font-medium px-1 pt-2">その他の通知</p>
          )}
          {unpinned.map((n) => {
            const colorClass = NOTIFICATION_COLORS[n.type as NotificationType] ?? 'bg-gray-100 text-gray-700 border-gray-300'
            const label      = NOTIFICATION_LABELS[n.type as NotificationType] ?? n.type
            const memberName = n.member?.name ?? n.deal.member?.name
            const memberColor = n.deal.member?.avatarColor

            return (
              <div
                key={n.id}
                className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
                  n.isRead ? 'opacity-45 bg-gray-50 border-gray-100' : 'bg-white border-gray-200 shadow-sm'
                }`}
              >
                <button
                  onClick={() => onMarkRead(n.id)}
                  className={`shrink-0 mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    n.isRead
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'border-gray-300 hover:border-emerald-400 bg-white'
                  }`}
                >
                  {n.isRead && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-bold border ${colorClass}`}>
                  {label}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {memberName && (
                      <span
                        className="text-xs font-bold text-white px-2.5 py-0.5 rounded-full"
                        style={{ backgroundColor: memberColor ?? '#6b7280' }}
                      >
                        {memberName}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm font-medium ${n.isRead ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                    {n.message}
                  </p>
                  <div className="flex gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                    <span>顧客: {n.deal.customerName}</span>
                    <span>{n.deal.status}</span>
                    {n.deal.dueDate && <span>期日: {formatDate(n.deal.dueDate)}</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(n.createdAt)}</p>
                </div>

                <button
                  onClick={() => onDelete(n.id)}
                  className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                  title="削除"
                >
                  <X size={15} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
