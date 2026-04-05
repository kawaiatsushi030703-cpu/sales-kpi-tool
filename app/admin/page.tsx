'use client'
import { useState, useEffect } from 'react'
import useSWR from 'swr'
import {
  ShieldCheck, Users, Target, Bell, BarChart2,
  Eye, EyeOff, Trash2, LogOut, Shield, Plus,
  Pencil, ChevronLeft, ChevronRight, Save, X,
  ExternalLink, History, PenLine, RefreshCw, CheckCircle, AlertCircle,
} from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())
const ADMIN_PASSWORD = 'ogata2024'

// ─── 型定義 ───────────────────────────────────────────
interface Member {
  id: number
  name: string
  avatarColor: string
  targetAmount: number
  category: string
  isAdmin: boolean
}
interface Notification {
  id: number
  type: string
  message: string
  isRead: boolean
  createdAt: string
  deal: { customerName: string; status: string }
  member: { name: string } | null
}
interface TeamGoal {
  periodType: string
  category: string
  year: number
  month: number | null
  targetAmount: number
}

// ─── ログイン画面 ──────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState('')
  const [error, setError] = useState(false)
  const [show, setShow] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pw === ADMIN_PASSWORD) {
      localStorage.setItem('adminMode', 'true')
      onLogin()
    } else {
      setError(true)
      setPw('')
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-sm shadow-xl border border-gray-800">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-red-700 rounded-2xl flex items-center justify-center mb-3">
            <ShieldCheck size={28} className="text-white" />
          </div>
          <h1 className="text-white text-xl font-bold">管理者ログイン</h1>
          <p className="text-gray-500 text-sm mt-1">管理者専用エリア</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-400 text-xs uppercase tracking-wider block mb-1.5">パスワード</label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={pw}
                onChange={(e) => { setPw(e.target.value); setError(false) }}
                placeholder="管理者パスワードを入力"
                className={`w-full bg-gray-800 text-white rounded-lg px-4 py-3 pr-10 border outline-none focus:ring-2 focus:ring-red-500 transition-all ${
                  error ? 'border-red-500' : 'border-gray-700 focus:border-red-500'
                }`}
              />
              <button type="button" onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {error && <p className="text-red-400 text-xs mt-1">パスワードが正しくありません</p>}
          </div>
          <button type="submit"
            className="w-full bg-red-700 hover:bg-red-600 text-white font-semibold py-3 rounded-lg transition-colors">
            ログイン
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── メインページ ──────────────────────────────────────
export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [activeSection, setActiveSection] = useState<'overview' | 'members' | 'goals' | 'notifications' | 'history' | 'sales-entry' | 'sync'>('overview')

  useEffect(() => {
    if (localStorage.getItem('adminMode') === 'true') setAuthed(true)
  }, [])

  const { data: members, mutate: mutateMembers } = useSWR<Member[]>(authed ? '/api/members' : null, fetcher)
  const { data: notifications, mutate: mutateNotifications } = useSWR<Notification[]>(authed ? '/api/notifications' : null, fetcher)
  const { data: dashboardData } = useSWR(authed ? '/api/dashboard' : null, fetcher)
  const { data: goals, mutate: mutateGoals } = useSWR<TeamGoal[]>(authed ? '/api/team-goals' : null, fetcher)

  const handleLogout = () => {
    localStorage.removeItem('adminMode')
    setAuthed(false)
  }

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />

  const unreadCount = (notifications ?? []).filter((n) => !n.isRead).length
  const memberCount = (members ?? []).length

  const navSections = [
    { key: 'overview',      label: '概要',        icon: BarChart2 },
    { key: 'sync',          label: 'スプシ同期',   icon: RefreshCw },
    { key: 'sales-entry',   label: '売上入力',     icon: PenLine },
    { key: 'members',       label: 'メンバー管理', icon: Users },
    { key: 'goals',         label: 'チーム目標',   icon: Target },
    { key: 'notifications', label: '通知管理',     icon: Bell },
    { key: 'history',       label: '月別履歴',     icon: History },
  ] as const

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-red-700 rounded-xl flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">管理者画面</h1>
            <p className="text-gray-500 text-xs mt-0.5">Full access panel</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a href="/deals" target="_blank"
            className="flex items-center gap-1.5 text-gray-400 hover:text-indigo-400 transition-colors text-sm">
            <ExternalLink size={14} />案件管理
          </a>
          <button onClick={handleLogout}
            className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors text-sm">
            <LogOut size={16} />ログアウト
          </button>
        </div>
      </header>

      <div className="flex">
        <nav className="w-48 bg-gray-900 min-h-screen p-3 space-y-1 border-r border-gray-800">
          {navSections.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveSection(key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                activeSection === key ? 'bg-red-700 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}>
              <Icon size={16} />{label}
            </button>
          ))}
        </nav>

        <main className="flex-1 p-6 space-y-5 overflow-auto">
          {activeSection === 'overview' && (
            <OverviewSection
              memberCount={memberCount}
              unreadCount={unreadCount}
              dashboardData={dashboardData}
            />
          )}
          {activeSection === 'members' && (
            <MembersSection members={members ?? []} mutate={mutateMembers} />
          )}
          {activeSection === 'goals' && (
            <GoalsSection goals={goals ?? []} mutate={mutateGoals} />
          )}
          {activeSection === 'notifications' && (
            <NotificationsSection notifications={notifications ?? []} mutate={mutateNotifications} />
          )}
          {activeSection === 'sales-entry' && <SalesEntrySection />}
          {activeSection === 'history' && <HistorySection />}
          {activeSection === 'sync' && <SyncSection />}
        </main>
      </div>
    </div>
  )
}

// ─── 概要セクション ───────────────────────────────────
function OverviewSection({ memberCount, unreadCount, dashboardData }: {
  memberCount: number
  unreadCount: number
  dashboardData: Record<string, Record<string, number>> | undefined
}) {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold">概要</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="メンバー数" value={String(memberCount)} />
        <StatCard label="未読通知" value={String(unreadCount)} color="text-red-400" />
        <StatCard label="月間着金" value={
          dashboardData?.monthly?.payment != null
            ? new Intl.NumberFormat('en-US').format(Math.round(dashboardData.monthly.payment))
            : '---'
        } color="text-indigo-400" />
        <StatCard label="月間達成率" value={`${dashboardData?.monthly?.achievementRate ?? '---'}%`} color="text-amber-400" />
      </div>
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 text-sm text-gray-400 space-y-1">
        <p className="text-gray-300 font-semibold mb-2">管理者でできること</p>
        <p>• メンバーの追加・編集・削除、管理者権限の付与</p>
        <p>• チーム目標（月間・年間）の設定・変更</p>
        <p>• 保護通知を含むすべての通知の削除</p>
        <p>• 案件の編集・ステータス変更 → <a href="/deals" target="_blank" className="text-indigo-400 underline">案件管理ページ</a></p>
      </div>
    </div>
  )
}

function StatCard({ label, value, color = 'text-white' }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <p className="text-gray-500 text-xs uppercase tracking-wider">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  )
}

// ─── メンバー管理セクション ───────────────────────────
function MembersSection({ members, mutate }: { members: Member[]; mutate: () => void }) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Member | null>(null)
  const [addForm, setAddForm] = useState({ name: '', targetAmount: '', category: '物販', avatarColor: '#6366f1' })
  const [editForm, setEditForm] = useState({ name: '', targetAmount: '', category: '物販', avatarColor: '#6366f1' })
  const [saving, setSaving] = useState(false)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addForm.name,
          targetAmount: Math.round((parseFloat(addForm.targetAmount) || 0) * 10000),
          category: addForm.category,
          avatarColor: addForm.avatarColor,
        }),
      })
      if (res.ok) {
        setAddForm({ name: '', targetAmount: '', category: '物販', avatarColor: '#6366f1' })
        setShowAddForm(false)
        mutate()
      }
    } finally {
      setSaving(false)
    }
  }

  const handleEditOpen = (m: Member) => {
    setEditTarget(m)
    setEditForm({
      name: m.name,
      targetAmount: String(Math.round(m.targetAmount / 10000)),
      category: m.category,
      avatarColor: m.avatarColor,
    })
  }

  const handleEditSave = async () => {
    if (!editTarget) return
    setSaving(true)
    try {
      const res = await fetch(`/api/members/${editTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          targetAmount: Math.round((parseFloat(editForm.targetAmount) || 0) * 10000),
          category: editForm.category,
          avatarColor: editForm.avatarColor,
        }),
      })
      if (res.ok) { setEditTarget(null); mutate() }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (m: Member) => {
    if (!confirm(`「${m.name}」を削除しますか？\n※関連する案件・通知も削除されます`)) return
    const res = await fetch(`/api/members/${m.id}`, { method: 'DELETE' })
    if (res.ok) mutate()
    else alert('削除できませんでした（関連データが残っている可能性があります）')
  }

  const handleToggleAdmin = async (m: Member) => {
    if (!confirm(`${m.name} を${m.isAdmin ? '管理者から解除' : '管理者に設定'}しますか？`)) return
    const res = await fetch(`/api/members/${m.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAdmin: !m.isAdmin }),
    })
    if (res.ok) mutate()
  }

  const COLOR_OPTIONS = [
    '#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#6366f1', '#ec4899', '#14b8a6',
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">メンバー管理</h2>
        <button onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={15} />メンバー追加
        </button>
      </div>

      {/* 追加フォーム */}
      {showAddForm && (
        <div className="bg-gray-900 rounded-xl border border-indigo-700 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-indigo-300">新しいメンバー</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">名前 *</label>
              <input required value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="山田 太郎" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">月間目標（万円）</label>
              <input type="number" min="0" value={addForm.targetAmount}
                onChange={(e) => setAddForm({ ...addForm, targetAmount: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="300" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">カテゴリ</label>
              <select value={addForm.category} onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                <option>物販</option>
                <option>AI</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">カラー</label>
              <div className="flex gap-2 flex-wrap">
                {COLOR_OPTIONS.map((c) => (
                  <button key={c} type="button" onClick={() => setAddForm({ ...addForm, avatarColor: c })}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${addForm.avatarColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ background: c }} />
                ))}
              </div>
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-50">
                {saving ? '追加中...' : '追加する'}
              </button>
              <button type="button" onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors">
                キャンセル
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 編集モーダル */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">メンバー編集</h3>
              <button onClick={() => setEditTarget(null)} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">名前</label>
                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">月間目標（万円）</label>
                <input type="number" min="0" value={editForm.targetAmount}
                  onChange={(e) => setEditForm({ ...editForm, targetAmount: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">カテゴリ</label>
                <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                  <option>物販</option>
                  <option>AI</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">カラー</label>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_OPTIONS.map((c) => (
                    <button key={c} type="button" onClick={() => setEditForm({ ...editForm, avatarColor: c })}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${editForm.avatarColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                      style={{ background: c }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleEditSave} disabled={saving}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-50">
                <Save size={14} />{saving ? '保存中...' : '保存する'}
              </button>
              <button onClick={() => setEditTarget(null)}
                className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors">
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* メンバーテーブル */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
              <th className="px-4 py-3 text-left">名前</th>
              <th className="px-4 py-3 text-left">カテゴリ</th>
              <th className="px-4 py-3 text-right">月間目標</th>
              <th className="px-4 py-3 text-center">管理者</th>
              <th className="px-4 py-3 text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: m.avatarColor }}>
                      {m.name[0]}
                    </div>
                    <span className="font-semibold">{m.name}</span>
                    {m.isAdmin && <Shield size={13} className="text-red-400" />}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-400">{m.category}</td>
                <td className="px-4 py-3 text-right text-gray-300">
                  {m.targetAmount > 0 ? `¥${(m.targetAmount / 10000).toFixed(0)}万` : '−'}
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => handleToggleAdmin(m)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${m.isAdmin ? 'bg-red-600' : 'bg-gray-700'}`}
                    title={m.isAdmin ? '管理者を解除' : '管理者に設定'}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${m.isAdmin ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => handleEditOpen(m)}
                      className="p-1.5 text-gray-500 hover:text-indigo-400 hover:bg-indigo-900/30 rounded transition-colors" title="編集">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(m)}
                      className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/30 rounded transition-colors" title="削除">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {members.length === 0 && (
          <p className="text-center text-gray-600 py-8">メンバーがいません</p>
        )}
      </div>
    </div>
  )
}

// ─── チーム目標セクション ─────────────────────────────
type Category = '物販' | 'AI' | '総合'
const CATEGORIES: Category[] = ['物販', 'AI', '総合']
const CATEGORY_COLOR: Record<Category, string> = {
  物販: 'text-orange-400', AI: 'text-cyan-400', 総合: 'text-indigo-400',
}

function GoalsSection({ goals, mutate }: { goals: TeamGoal[]; mutate: () => void }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [inputs, setInputs] = useState<Record<Category, string>>({ 物販: '', AI: '', 総合: '' })
  const [annualInputs, setAnnualInputs] = useState<Record<Category, string>>({ 物販: '', AI: '', 総合: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<'monthly' | 'annual' | null>(null)
  const [prevKey, setPrevKey] = useState('')

  const getMonthlyValue = (cat: Category) => {
    const g = goals.find((g) => g.periodType === 'monthly' && g.category === cat && g.year === year && g.month === month)
    return g ? String(Math.round(g.targetAmount / 10000)) : ''
  }
  const getAnnualValue = (cat: Category) => {
    const g = goals.find((g) => g.periodType === 'annual' && g.category === cat && g.year === year)
    return g ? String(Math.round(g.targetAmount / 10000)) : ''
  }

  const key = `${year}-${month}`
  if (goals.length > 0 && key !== prevKey) {
    setInputs({ 物販: getMonthlyValue('物販'), AI: getMonthlyValue('AI'), 総合: getMonthlyValue('総合') })
    setAnnualInputs({ 物販: getAnnualValue('物販'), AI: getAnnualValue('AI'), 総合: getAnnualValue('総合') })
    setPrevKey(key)
    setSaved(null)
  }

  const prevMonth = () => { if (month === 1) { setYear(y => y - 1); setMonth(12) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 12) { setYear(y => y + 1); setMonth(1) } else setMonth(m => m + 1) }

  const saveGoals = async (type: 'monthly' | 'annual') => {
    setSaving(true)
    setSaved(null)
    try {
      const src = type === 'monthly' ? inputs : annualInputs
      await Promise.all(CATEGORIES.map((cat) =>
        fetch('/api/team-goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            periodType: type,
            category: cat,
            targetAmount: (parseFloat(src[cat]) || 0) * 10000,
            year,
            ...(type === 'monthly' ? { month } : { month: null }),
          }),
        })
      ))
      await mutate()
      setSaved(type)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold">チーム目標設定</h2>

      {/* 月間目標 */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-200">月間目標</h3>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"><ChevronLeft size={16} /></button>
            <span className="text-white font-bold min-w-[100px] text-center">{year}年{month}月</span>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"><ChevronRight size={16} /></button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {CATEGORIES.map((cat) => (
            <div key={cat}>
              <label className={`text-xs font-semibold block mb-1.5 ${CATEGORY_COLOR[cat]}`}>{cat}</label>
              <div className="flex items-center gap-2">
                <input type="number" min="0" value={inputs[cat]}
                  onChange={(e) => { setInputs({ ...inputs, [cat]: e.target.value }); setSaved(null) }}
                  placeholder="0"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                <span className="text-gray-500 text-xs shrink-0">万円</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => saveGoals('monthly')} disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-50">
            <Save size={14} />{saving ? '保存中...' : '保存する'}
          </button>
          {saved === 'monthly' && <span className="text-green-400 text-sm font-medium">保存しました</span>}
        </div>
      </div>

      {/* 年間目標 */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
        <h3 className="font-semibold text-gray-200">年間目標（{year}年）</h3>
        <div className="grid grid-cols-3 gap-4">
          {CATEGORIES.map((cat) => (
            <div key={cat}>
              <label className={`text-xs font-semibold block mb-1.5 ${CATEGORY_COLOR[cat]}`}>{cat}</label>
              <div className="flex items-center gap-2">
                <input type="number" min="0" value={annualInputs[cat]}
                  onChange={(e) => { setAnnualInputs({ ...annualInputs, [cat]: e.target.value }); setSaved(null) }}
                  placeholder="0"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                <span className="text-gray-500 text-xs shrink-0">万円</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => saveGoals('annual')} disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-50">
            <Save size={14} />{saving ? '保存中...' : '保存する'}
          </button>
          {saved === 'annual' && <span className="text-green-400 text-sm font-medium">保存しました</span>}
        </div>
      </div>
    </div>
  )
}

// ─── 月別履歴セクション ───────────────────────────────
interface HistoryPayment {
  id: number
  dealId: number
  amount: number
  paidAt: string
  customerName: string
  productName: string
  contractAmount: number
  category: string
  status: string
  memberName: string
  memberColor: string
}
interface HistoryMemberStat {
  id: number
  name: string
  avatarColor: string
  targetAmount: number
  paymentAmount: number
  achievementRate: number
  dealCount: number
}
interface HistoryData {
  year: number
  month: number
  summary: { totalPayment: number; buhanPayment: number; aiPayment: number; paymentCount: number; dealCount: number }
  memberStats: HistoryMemberStat[]
  payments: HistoryPayment[]
}

// ─── スプシ同期セクション ─────────────────────────────
interface SyncResult {
  success: boolean
  syncedAt: string
  imported: number
  skipped: number
  unknownMembers: string[]
  sheets: Array<{ sheet: string; imported: number; skipped: number; total: number; unknownMembers: string[] }>
  notificationsCreated: number
}

function SyncSection() {
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<SyncResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSync = async () => {
    setSyncing(true)
    setResult(null)
    setError(null)
    try {
      const res = await fetch('/api/sync/manual', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '同期に失敗しました')
      setResult(data)
    } catch (e) {
      setError(String(e))
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold">スプレッドシート同期</h2>
        <p className="text-gray-500 text-sm mt-0.5">Googleスプレッドシートから最新データを取り込みます</p>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
        <div className="text-sm text-gray-400 space-y-1">
          <p className="text-gray-300 font-semibold mb-2">同期対象シート</p>
          <p>• 抽出一覧</p>
          <p>• 美奈子セミナー</p>
          <p>• クローザー報告</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors"
        >
          <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
          {syncing ? '同期中...' : 'いますぐ同期する'}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 font-semibold text-sm">エラー</p>
            <p className="text-red-400 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className="bg-emerald-900/30 border border-emerald-700 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle size={18} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-emerald-300 font-semibold text-sm">同期完了</p>
              <p className="text-gray-400 text-xs mt-1">
                取込: {result.imported}件　スキップ: {result.skipped}件　通知生成: {result.notificationsCreated}件
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {result.sheets.map(s => (
              <div key={s.sheet} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                <p className="text-white font-semibold text-sm mb-2">{s.sheet}</p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-gray-500 text-xs">合計行数</p>
                    <p className="text-white font-bold">{s.total}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">取込</p>
                    <p className="text-emerald-400 font-bold">{s.imported}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">スキップ</p>
                    <p className="text-gray-400 font-bold">{s.skipped}</p>
                  </div>
                </div>
                {s.unknownMembers.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-800">
                    <p className="text-yellow-500 text-xs font-semibold mb-1">未登録メンバー（スキップ）:</p>
                    <p className="text-yellow-400 text-xs">{s.unknownMembers.join(', ')}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── 売上入力セクション ───────────────────────────────
interface MonthlySummaryData {
  year: number; month: number
  buhanContract: number; buhanPayment: number
  aiContract: number; aiPayment: number
  notes?: string
}

function SalesEntrySection() {
  const now = new Date()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [form, setForm]   = useState({ buhanContract: '', buhanPayment: '', aiContract: '', aiPayment: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  const { data: existing, mutate } = useSWR<MonthlySummaryData>(
    `/api/admin/monthly-summary?year=${year}&month=${month}`,
    fetcher,
    {
      onSuccess: (d) => {
        setForm({
          buhanContract: d.buhanContract ? String(d.buhanContract / 10000) : '',
          buhanPayment:  d.buhanPayment  ? String(d.buhanPayment  / 10000) : '',
          aiContract:    d.aiContract    ? String(d.aiContract    / 10000) : '',
          aiPayment:     d.aiPayment     ? String(d.aiPayment     / 10000) : '',
          notes: d.notes ?? '',
        })
        setSaved(false)
      },
    }
  )

  const prevMonth = () => { if (month === 1) { setYear(y => y - 1); setMonth(12) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 12) { setYear(y => y + 1); setMonth(1) } else setMonth(m => m + 1) }

  const man = (v: string) => parseFloat(v) || 0
  const totalContract = man(form.buhanContract) + man(form.aiContract)
  const totalPayment  = man(form.buhanPayment)  + man(form.aiPayment)

  const handleSave = async () => {
    setSaving(true); setSaved(false)
    try {
      const res = await fetch('/api/admin/monthly-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year, month,
          buhanContract: Math.round(man(form.buhanContract) * 10000),
          buhanPayment:  Math.round(man(form.buhanPayment)  * 10000),
          aiContract:    Math.round(man(form.aiContract)    * 10000),
          aiPayment:     Math.round(man(form.aiPayment)     * 10000),
          notes: form.notes || null,
        }),
      })
      if (res.ok) { setSaved(true); mutate() }
      else alert('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const field = (label: string, key: keyof typeof form, color: string) => (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-3">
      <p className={`text-sm font-bold ${color}`}>{label}</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 block mb-1.5">売上額（万円）</label>
          <input type="number" min="0" step="0.1" placeholder="0"
            value={key === 'buhanContract' ? form.buhanContract : key === 'aiContract' ? form.aiContract : ''}
            onChange={(e) => { setSaved(false); setForm((f) => ({ ...f, [key]: e.target.value })) }}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm text-right outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1.5">着金額（万円）</label>
          <input type="number" min="0" step="0.1" placeholder="0"
            value={key === 'buhanContract' ? form.buhanPayment : form.aiPayment}
            onChange={(e) => {
              setSaved(false)
              const pk = key === 'buhanContract' ? 'buhanPayment' : 'aiPayment'
              setForm((f) => ({ ...f, [pk]: e.target.value }))
            }}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm text-right outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold">売上入力</h2>
          <p className="text-gray-500 text-sm mt-0.5">チーム全体の月次合計を記録します（万円単位）</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"><ChevronLeft size={16} /></button>
          <span className="text-white font-bold min-w-[110px] text-center">{year}年{month}月</span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"><ChevronRight size={16} /></button>
        </div>
      </div>

      {existing && (existing.buhanContract > 0 || existing.aiContract > 0) && (
        <div className="bg-indigo-900/30 border border-indigo-700 rounded-xl px-4 py-2.5 text-sm text-indigo-300">
          既存データあり — 上書き保存します
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 物販 */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-3">
          <p className="text-sm font-bold text-orange-400">物販</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">売上額（万円）</label>
              <input type="number" min="0" step="0.1" placeholder="0" value={form.buhanContract}
                onChange={(e) => { setSaved(false); setForm((f) => ({ ...f, buhanContract: e.target.value })) }}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm text-right outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">着金額（万円）</label>
              <input type="number" min="0" step="0.1" placeholder="0" value={form.buhanPayment}
                onChange={(e) => { setSaved(false); setForm((f) => ({ ...f, buhanPayment: e.target.value })) }}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm text-right outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
          </div>
        </div>

        {/* AI */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-3">
          <p className="text-sm font-bold text-cyan-400">AI</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">売上額（万円）</label>
              <input type="number" min="0" step="0.1" placeholder="0" value={form.aiContract}
                onChange={(e) => { setSaved(false); setForm((f) => ({ ...f, aiContract: e.target.value })) }}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm text-right outline-none focus:ring-2 focus:ring-cyan-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">着金額（万円）</label>
              <input type="number" min="0" step="0.1" placeholder="0" value={form.aiPayment}
                onChange={(e) => { setSaved(false); setForm((f) => ({ ...f, aiPayment: e.target.value })) }}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm text-right outline-none focus:ring-2 focus:ring-cyan-500" />
            </div>
          </div>
        </div>
      </div>

      {/* 合計プレビュー */}
      {(totalContract > 0 || totalPayment > 0) && (
        <div className="bg-gray-800 rounded-xl px-5 py-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">売上合計</p>
            <p className="text-xl font-bold text-orange-300">{totalContract.toFixed(1)}万円</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">着金合計</p>
            <p className="text-xl font-bold text-indigo-300">{totalPayment.toFixed(1)}万円</p>
          </div>
        </div>
      )}

      {/* メモ */}
      <div>
        <label className="text-xs text-gray-500 block mb-1.5">メモ（任意）</label>
        <input type="text" placeholder="例: スプシ3月分" value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>

      <div className="flex items-center gap-4">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors disabled:opacity-50">
          <Save size={16} />{saving ? '保存中...' : `${year}年${month}月を保存`}
        </button>
        {saved && <span className="text-emerald-400 font-medium text-sm">✓ 保存しました</span>}
      </div>
    </div>
  )
}

// ─── 月別履歴セクション ───────────────────────────────
const EMPTY_FORM = { memberId: '', customerName: '', productName: '', category: '物販', contractAmount: '', paymentAmount: '', paidAt: '', status: '成約' }

interface BulkRow {
  memberId: number
  name: string
  avatarColor: string
  category: string
  contractAmount: string // 万円
  paymentAmount: string  // 万円
}

function HistorySection() {
  const now = new Date()
  const [year, setYear] = useState(now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() === 0 ? 12 : now.getMonth()) // 先月
  const [tab, setTab] = useState<'summary' | 'payments' | 'bulk'>('bulk')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([])
  const [bulkSaving, setBulkSaving] = useState(false)
  const [bulkSaved, setBulkSaved] = useState(false)

  const { data, isLoading, mutate } = useSWR<HistoryData>(
    `/api/admin/history?year=${year}&month=${month}`,
    fetcher
  )
  const { data: members } = useSWR<Member[]>('/api/members', fetcher, {
    onSuccess: (ms) => {
      if (bulkRows.length === 0 && ms?.length) {
        setBulkRows(ms.map((m) => ({
          memberId: m.id, name: m.name, avatarColor: m.avatarColor,
          category: m.category ?? '物販', contractAmount: '', paymentAmount: '',
        })))
      }
    },
  })

  const prevMonth = () => { if (month === 1) { setYear(y => y - 1); setMonth(12) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 12) { setYear(y => y + 1); setMonth(1) } else setMonth(m => m + 1) }

  const fmt = (n: number) => { const man = n / 10000; return `${parseFloat(man.toFixed(2))}万円` }
  const fmtDate = (s: string) => {
    const d = new Date(s)
    return `${d.getMonth() + 1}/${d.getDate()}`
  }

  // 月の最終日をデフォルト着金日に
  const defaultPaidAt = () => {
    const lastDay = new Date(year, month, 0)
    return lastDay.toISOString().slice(0, 10)
  }

  const handleOpenForm = () => {
    setForm({ ...EMPTY_FORM, paidAt: defaultPaidAt() })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.memberId || !form.customerName || !form.paidAt) return
    setSaving(true)
    try {
      const contractAmount = Math.round((parseFloat(form.contractAmount) || 0) * 10000)
      const paymentAmount  = Math.round((parseFloat(form.paymentAmount)  || 0) * 10000)
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: parseInt(form.memberId),
          customerName: form.customerName,
          productName: form.productName || '未設定',
          category: form.category,
          contractAmount,
          paymentAmount,
          status: form.status,
          meetingDate: form.paidAt,
        }),
      })
      if (res.ok) {
        setShowForm(false)
        setForm(EMPTY_FORM)
        mutate()
      } else {
        alert('保存に失敗しました')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (paymentId: number, dealId: number) => {
    if (!confirm('この着金データを削除しますか？')) return
    setDeleteId(paymentId)
    try {
      await fetch(`/api/deals/${dealId}`, { method: 'DELETE' })
      mutate()
    } finally {
      setDeleteId(null)
    }
  }

  const handleBulkSave = async () => {
    const targets = bulkRows.filter((r) => parseFloat(r.contractAmount) > 0 || parseFloat(r.paymentAmount) > 0)
    if (targets.length === 0) return
    if (!confirm(`${targets.length}件の売上データを${year}年${month}月として保存しますか？`)) return
    setBulkSaving(true)
    setBulkSaved(false)
    const lastDay = new Date(year, month, 0).toISOString().slice(0, 10)
    try {
      await Promise.all(targets.map((r) =>
        fetch('/api/deals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memberId: r.memberId,
            customerName: `${year}年${month}月 月次売上`,
            productName: '月次サマリー',
            category: r.category,
            contractAmount: Math.round((parseFloat(r.contractAmount) || 0) * 10000),
            paymentAmount:  Math.round((parseFloat(r.paymentAmount)  || 0) * 10000),
            status: '成約',
            meetingDate: lastDay,
          }),
        })
      ))
      setBulkSaved(true)
      setBulkRows((rows) => rows.map((r) => ({ ...r, contractAmount: '', paymentAmount: '' })))
      mutate()
    } finally {
      setBulkSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-bold">月別履歴</h2>
        <div className="flex items-center gap-3">
          <button onClick={handleOpenForm}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus size={14} />売上を入力
          </button>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"><ChevronLeft size={16} /></button>
            <span className="text-white font-bold min-w-[110px] text-center">{year}年{month}月</span>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      {/* 入力モーダル */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">{year}年{month}月 売上入力</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-gray-400 block mb-1">担当者 *</label>
                  <select required value={form.memberId} onChange={(e) => setForm({ ...form, memberId: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">選択してください</option>
                    {(members ?? []).map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-400 block mb-1">顧客名 *</label>
                  <input required value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    placeholder="山田 花子"
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">商品名</label>
                  <input value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })}
                    placeholder="例: AI ONE"
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">カテゴリ</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                    <option>物販</option>
                    <option>AI</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">売上額（万円）</label>
                  <input type="number" min="0" step="0.1" value={form.contractAmount}
                    onChange={(e) => setForm({ ...form, contractAmount: e.target.value })}
                    placeholder="29.8"
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">着金額（万円）</label>
                  <input type="number" min="0" step="0.1" value={form.paymentAmount}
                    onChange={(e) => setForm({ ...form, paymentAmount: e.target.value })}
                    placeholder="29.8"
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">着金日 *</label>
                  <input required type="date" value={form.paidAt}
                    min={`${year}-${String(month).padStart(2, '0')}-01`}
                    max={new Date(year, month, 0).toISOString().slice(0, 10)}
                    onChange={(e) => setForm({ ...form, paidAt: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">ステータス</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                    <option>成約</option>
                    <option>一部決済</option>
                    <option>決済待ち</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50">
                  <Save size={14} />{saving ? '保存中...' : '保存する'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors">
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading && <p className="text-gray-500 text-sm">読み込み中...</p>}

      {data && (
        <>
          {/* サマリーカード */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <p className="text-gray-500 text-xs uppercase tracking-wider">月間着金</p>
              <p className="text-indigo-400 text-2xl font-bold mt-1">{fmt(data.summary.totalPayment)}</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <p className="text-gray-500 text-xs uppercase tracking-wider">物販</p>
              <p className="text-orange-400 text-2xl font-bold mt-1">{fmt(data.summary.buhanPayment)}</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <p className="text-gray-500 text-xs uppercase tracking-wider">AI</p>
              <p className="text-cyan-400 text-2xl font-bold mt-1">{fmt(data.summary.aiPayment)}</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <p className="text-gray-500 text-xs uppercase tracking-wider">着金件数</p>
              <p className="text-white text-2xl font-bold mt-1">{data.summary.paymentCount}件</p>
            </div>
          </div>

          {/* タブ */}
          <div className="flex gap-2 flex-wrap">
            {([['bulk', '一括入力'], ['summary', 'メンバー別'], ['payments', '着金明細']] as const).map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                {label}
              </button>
            ))}
          </div>

          {/* 一括入力 */}
          {tab === 'bulk' && (
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">{year}年{month}月のチーム全体の売上を入力してください。金額は万円単位です。</p>
              <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
                      <th className="px-4 py-3 text-left">メンバー</th>
                      <th className="px-4 py-3 text-center">カテゴリ</th>
                      <th className="px-4 py-3 text-right">売上額（万円）</th>
                      <th className="px-4 py-3 text-right">着金額（万円）</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkRows.map((row, i) => (
                      <tr key={row.memberId} className="border-b border-gray-800">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                              style={{ background: row.avatarColor }}>{row.name[0]}</div>
                            <span className="font-semibold text-white">{row.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <select
                            value={row.category}
                            onChange={(e) => setBulkRows((rows) => rows.map((r, j) => j === i ? { ...r, category: e.target.value } : r))}
                            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option>物販</option>
                            <option>AI</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number" min="0" step="0.1"
                            value={row.contractAmount}
                            onChange={(e) => setBulkRows((rows) => rows.map((r, j) => j === i ? { ...r, contractAmount: e.target.value } : r))}
                            placeholder="0"
                            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-1.5 text-sm text-right outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number" min="0" step="0.1"
                            value={row.paymentAmount}
                            onChange={(e) => setBulkRows((rows) => rows.map((r, j) => j === i ? { ...r, paymentAmount: e.target.value } : r))}
                            placeholder="0"
                            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-1.5 text-sm text-right outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 合計プレビュー */}
              {bulkRows.some((r) => parseFloat(r.paymentAmount) > 0 || parseFloat(r.contractAmount) > 0) && (
                <div className="flex gap-4 bg-gray-800 rounded-xl px-5 py-3 text-sm flex-wrap">
                  <span className="text-gray-400">入力合計：</span>
                  <span className="text-indigo-300 font-bold">
                    売上 {bulkRows.reduce((s, r) => s + (parseFloat(r.contractAmount) || 0), 0).toFixed(1)}万円
                  </span>
                  <span className="text-emerald-300 font-bold">
                    着金 {bulkRows.reduce((s, r) => s + (parseFloat(r.paymentAmount) || 0), 0).toFixed(1)}万円
                  </span>
                </div>
              )}

              <div className="flex items-center gap-4">
                <button onClick={handleBulkSave} disabled={bulkSaving}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50">
                  <Save size={15} />{bulkSaving ? '保存中...' : `${year}年${month}月として保存`}
                </button>
                {bulkSaved && <span className="text-emerald-400 text-sm font-medium">保存しました</span>}
              </div>
            </div>
          )}

          {/* メンバー別 */}
          {tab === 'summary' && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              {data.memberStats.length === 0 && (
                <p className="text-center text-gray-600 py-8">着金データなし</p>
              )}
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">メンバー</th>
                    <th className="px-4 py-3 text-right">着金額</th>
                    <th className="px-4 py-3 text-right">目標</th>
                    <th className="px-4 py-3 text-right">達成率</th>
                    <th className="px-4 py-3 text-right">件数</th>
                  </tr>
                </thead>
                <tbody>
                  {data.memberStats.sort((a, b) => b.paymentAmount - a.paymentAmount).map((m) => (
                    <tr key={m.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ background: m.avatarColor }}>{m.name[0]}</div>
                          <span className="font-semibold">{m.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-indigo-300 font-bold">{fmt(m.paymentAmount)}</td>
                      <td className="px-4 py-3 text-right text-gray-400">{m.targetAmount > 0 ? fmt(m.targetAmount) : '−'}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-bold ${m.achievementRate >= 100 ? 'text-emerald-400' : m.achievementRate >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
                          {m.achievementRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400">{m.dealCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 着金明細 */}
          {tab === 'payments' && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              {data.payments.length === 0 && (
                <p className="text-center text-gray-600 py-8">着金データなし</p>
              )}
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">日付</th>
                    <th className="px-4 py-3 text-left">担当</th>
                    <th className="px-4 py-3 text-left">顧客名</th>
                    <th className="px-4 py-3 text-left">商品</th>
                    <th className="px-4 py-3 text-right">着金額</th>
                    <th className="px-4 py-3 text-center">ステータス</th>
                    <th className="px-4 py-3 text-center">削除</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments.map((p) => (
                    <tr key={p.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="px-4 py-3 text-gray-400 shrink-0">{fmtDate(p.paidAt)}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold text-white px-2 py-0.5 rounded-full" style={{ backgroundColor: p.memberColor }}>{p.memberName}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-200 max-w-[120px] truncate">{p.customerName}</td>
                      <td className="px-4 py-3 text-gray-400 max-w-[100px] truncate">{p.productName}</td>
                      <td className="px-4 py-3 text-right text-indigo-300 font-bold">{fmt(p.amount)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          p.status === '成約' ? 'bg-emerald-900 text-emerald-300' :
                          p.status === '一部決済' ? 'bg-orange-900 text-orange-300' :
                          'bg-gray-800 text-gray-400'
                        }`}>{p.status}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDelete(p.id, p.dealId)}
                          disabled={deleteId === p.id}
                          className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-900/30 rounded transition-colors disabled:opacity-30"
                          title="削除"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── 通知管理セクション ───────────────────────────────
function NotificationsSection({ notifications, mutate }: { notifications: Notification[]; mutate: () => void }) {
  const handleDelete = async (id: number) => {
    if (!confirm('この通知を削除しますか？（保護通知も強制削除されます）')) return
    const res = await fetch(`/api/notifications/${id}`, {
      method: 'DELETE',
      headers: { 'X-Admin-Override': 'true' },
    })
    if (res.ok) mutate()
    else alert('削除に失敗しました')
  }

  const handleToggleRead = async (id: number) => {
    await fetch(`/api/notifications/${id}`, { method: 'PUT' })
    mutate()
  }

  const handleDeleteAll = async () => {
    if (!confirm(`全${notifications.length}件の通知を削除しますか？`)) return
    await Promise.all(
      notifications.map((n) =>
        fetch(`/api/notifications/${n.id}`, {
          method: 'DELETE',
          headers: { 'X-Admin-Override': 'true' },
        })
      )
    )
    mutate()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">通知管理（管理者モード）</h2>
        {notifications.length > 0 && (
          <button onClick={handleDeleteAll}
            className="flex items-center gap-2 bg-red-800 hover:bg-red-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
            <Trash2 size={13} />全件削除
          </button>
        )}
      </div>
      <p className="text-gray-500 text-sm">保護通知（一部決済・決済待ち）も削除可能です。</p>

      <div className="bg-gray-900 rounded-xl border border-gray-800 divide-y divide-gray-800">
        {notifications.length === 0 && (
          <p className="text-center text-gray-600 py-8">通知はありません</p>
        )}
        {notifications.map((n) => {
          const isProtected = ['一部決済', '決済待ち'].includes(n.deal?.status)
          return (
            <div key={n.id} className="flex items-start gap-3 p-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  {n.member && <span className="text-xs text-indigo-400 font-semibold">{n.member.name}</span>}
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                    isProtected ? 'bg-amber-900 text-amber-300' : 'bg-gray-800 text-gray-400'
                  }`}>
                    {n.deal?.status}{isProtected && ' [保護]'}
                  </span>
                  {!n.isRead && <span className="w-2 h-2 bg-red-500 rounded-full" />}
                </div>
                <p className="text-sm text-gray-300">{n.message}</p>
                <p className="text-xs text-gray-600 mt-0.5">顧客: {n.deal?.customerName}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => handleToggleRead(n.id)}
                  className="p-1.5 text-gray-600 hover:text-indigo-400 hover:bg-indigo-900/30 rounded transition-colors"
                  title={n.isRead ? '未読に戻す' : '既読にする'}>
                  <Eye size={14} />
                </button>
                <button onClick={() => handleDelete(n.id)}
                  className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-900/30 rounded transition-colors"
                  title="削除">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
