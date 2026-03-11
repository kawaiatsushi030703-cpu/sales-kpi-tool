'use client'
import { useState } from 'react'
import useSWR from 'swr'
import { Header } from '@/components/layout/Header'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { NotificationList } from '@/components/notifications/NotificationList'
import { CheckCircle, User } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface Member { id: number; name: string; avatarColor: string }

export default function NotificationsPage() {
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null)
  const [showUnread, setShowUnread] = useState(false)

  const apiUrl = selectedMemberId
    ? `/api/notifications?memberId=${selectedMemberId}`
    : '/api/notifications'

  const { data: notifications, mutate } = useSWR(apiUrl, fetcher, { refreshInterval: 30000 })
  const { data: members } = useSWR<Member[]>('/api/members', fetcher)

  const displayed = showUnread
    ? (notifications ?? []).filter((n: { isRead: boolean }) => !n.isRead)
    : (notifications ?? [])

  const unreadCount = (notifications ?? []).filter((n: { isRead: boolean }) => !n.isRead).length

  const handleMarkRead = async (id: number) => {
    await fetch(`/api/notifications/${id}`, { method: 'PUT' })
    await mutate()
  }

  const handleDelete = async (id: number) => {
    await fetch(`/api/notifications/${id}`, { method: 'DELETE' })
    await mutate()
  }

  const handleMarkAllRead = async () => {
    const unread = (notifications ?? []).filter((n: { isRead: boolean; id: number }) => !n.isRead)
    await Promise.all(unread.map((n: { id: number }) => fetch(`/api/notifications/${n.id}`, { method: 'PUT' })))
    await mutate()
  }

  return (
    <>
      <Header title="通知" subtitle="期日が近い案件のアラート" />

      <div className="p-3 md:p-6 space-y-4">
        {/* メンバー別フィルター */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <User size={16} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">個人フィルター</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedMemberId(null)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                selectedMemberId === null
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              全員
            </button>
            {(members ?? []).map((m: Member) => (
              <button
                key={m.id}
                onClick={() => setSelectedMemberId(m.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                  selectedMemberId === m.id
                    ? 'text-white border-transparent shadow-sm'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
                style={selectedMemberId === m.id ? { backgroundColor: m.avatarColor, borderColor: m.avatarColor } : {}}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <h2 className="font-semibold text-gray-800">
                  {selectedMemberId
                    ? `${members?.find(m => m.id === selectedMemberId)?.name} の通知`
                    : '通知一覧'}
                </h2>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-medium">
                    {unreadCount}件未読
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowUnread(!showUnread)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    showUnread ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {showUnread ? '全て表示' : '未読のみ'}
                </button>
                {unreadCount > 0 && (
                  <Button variant="secondary" size="sm" onClick={handleMarkAllRead}>
                    <CheckCircle size={14} />
                    全て既読
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <NotificationList
              notifications={displayed}
              onMarkRead={handleMarkRead}
              onDelete={handleDelete}
            />
          </CardBody>
        </Card>
      </div>
    </>
  )
}
