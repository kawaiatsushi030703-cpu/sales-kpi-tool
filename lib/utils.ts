import { clsx, type ClassValue } from 'clsx'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns'
import { ja } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

// 金額を日本円形式にフォーマット
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(amount)
}

// 達成率を計算（target=0の場合は0を返す）
export function calcAchievementRate(payment: number, target: number): number {
  if (target === 0) return 0
  return Math.round((payment / target) * 100)
}

// 現在の月の開始・終了日
export function getCurrentMonthRange() {
  const now = new Date()
  return {
    start: startOfMonth(now),
    end: endOfMonth(now),
  }
}

// 現在の週の開始・終了日（月曜始まり）
export function getCurrentWeekRange() {
  const now = new Date()
  return {
    start: startOfWeek(now, { weekStartsOn: 1 }),
    end: endOfWeek(now, { weekStartsOn: 1 }),
  }
}

// 日付をフォーマット
export function formatDate(date: string | Date | null): string {
  if (!date) return '-'
  return format(new Date(date), 'yyyy/MM/dd', { locale: ja })
}

// 期日までの日数を計算
export function getDaysUntilDue(dueDate: string | Date | null): number | null {
  if (!dueDate) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

// 期日の危険度ラベル
export function getDueDateLabel(dueDate: string | Date | null): { label: string; color: string } | null {
  const days = getDaysUntilDue(dueDate)
  if (days === null) return null
  if (days < 0) return { label: `${Math.abs(days)}日超過`, color: 'text-red-600 font-bold' }
  if (days === 0) return { label: '今日', color: 'text-red-600 font-bold' }
  if (days === 1) return { label: '明日', color: 'text-orange-500 font-bold' }
  if (days <= 3) return { label: `${days}日後`, color: 'text-yellow-600 font-semibold' }
  return { label: `${days}日後`, color: 'text-gray-500' }
}

// ISO週番号（簡易版）
export function getWeekNumber(date: Date): number {
  return Math.ceil(date.getDate() / 7)
}
