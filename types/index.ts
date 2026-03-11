// 共通型定義

export type DealStatus =
  | '成約'
  | '未成約'
  | '二回目遷移'
  | '一部決済'
  | '決済待ち'
  | '後追い'

export const DEAL_STATUSES: DealStatus[] = [
  '成約', '未成約', '二回目遷移', '一部決済', '決済待ち', '後追い',
]

export const STATUS_COLORS: Record<DealStatus, string> = {
  '成約':       'bg-green-100 text-green-700',
  '未成約':     'bg-red-100 text-red-700',
  '二回目遷移': 'bg-blue-100 text-blue-700',
  '一部決済':   'bg-yellow-100 text-yellow-700',
  '決済待ち':   'bg-purple-100 text-purple-700',
  '後追い':     'bg-orange-100 text-orange-700',
}

export const STATUS_BORDER_COLORS: Record<DealStatus, string> = {
  '成約':       'border-green-400',
  '未成約':     'border-red-400',
  '二回目遷移': 'border-blue-300',
  '一部決済':   'border-yellow-400',
  '決済待ち':   'border-purple-400',
  '後追い':     'border-orange-400',
}

export type NotificationType = 'due_today' | 'due_1day' | 'due_3days' | 'overdue'

export const NOTIFICATION_LABELS: Record<NotificationType, string> = {
  'due_today': '期日当日',
  'due_1day': '明日期日',
  'due_3days': '3日以内',
  'overdue': '期日超過',
}

export const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  'due_today': 'bg-red-100 text-red-700 border-red-300',
  'due_1day': 'bg-orange-100 text-orange-700 border-orange-300',
  'due_3days': 'bg-yellow-100 text-yellow-700 border-yellow-300',
  'overdue': 'bg-red-200 text-red-800 border-red-400',
}

// API レスポンス型
export interface MemberWithStats {
  id: number
  name: string
  email: string
  targetAmount: number
  avatarColor: string
  paymentAmount: number
  achievementRate: number
  dealCount: number
}

export interface DealWithMember {
  id: number
  customerName: string
  memberId: number
  memberName: string
  productName: string
  contractAmount: number
  paymentAmount: number
  remainingAmount: number
  status: DealStatus
  nextAction: string | null
  dueDate: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface DashboardData {
  monthly: {
    target: number
    payment: number
    achievementRate: number
  }
  weekly: {
    target: number
    payment: number
    achievementRate: number
  }
  members: MemberWithStats[]
  recentDeals: DealWithMember[]
  urgentDeals: DealWithMember[]
}

export interface RankingEntry {
  rank: number
  memberId: number
  memberName: string
  avatarColor: string
  paymentAmount: number
  targetAmount: number
  achievementRate: number
}
