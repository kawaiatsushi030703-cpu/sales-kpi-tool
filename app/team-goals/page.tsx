'use client'
import { useState } from 'react'
import useSWR from 'swr'
import { Header } from '@/components/layout/Header'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Category = '物販' | 'AI' | '総合'

const CATEGORIES: Category[] = ['物販', 'AI', '総合']

const CATEGORY_CONFIG: Record<Category, { color: string; description: string }> = {
  物販: { color: 'text-orange-600', description: '物販カテゴリの月間目標' },
  AI:   { color: 'text-cyan-600',   description: 'AIカテゴリの月間目標' },
  総合: { color: 'text-indigo-600', description: '全カテゴリ合計の月間目標' },
}

export default function TeamGoalsPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const { data: goals, mutate } = useSWR('/api/team-goals', fetcher)

  const getGoalValue = (category: Category, y: number, m: number): string => {
    if (!Array.isArray(goals)) return ''
    const goal = goals.find(
      (g: { periodType: string; category: string; year: number; month: number }) =>
        g.periodType === 'monthly' && g.category === category && g.year === y && g.month === m
    )
    return goal ? String(Math.round(goal.targetAmount / 10000)) : ''
  }

  const [inputs, setInputs] = useState<Record<Category, string>>({ 物販: '', AI: '', 総合: '' })
  const [prevKey, setPrevKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // 年月が変わったらinputsを更新
  const key = `${year}-${month}`
  if (Array.isArray(goals) && key !== prevKey) {
    setInputs({
      物販: getGoalValue('物販', year, month),
      AI:   getGoalValue('AI', year, month),
      総合: getGoalValue('総合', year, month),
    })
    setPrevKey(key)
    setSaved(false)
  }

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  const handleChange = (category: Category, value: string) => {
    setInputs(prev => ({ ...prev, [category]: value }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await Promise.all(
        CATEGORIES.map((category) =>
          fetch('/api/team-goals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              periodType: 'monthly',
              category,
              targetAmount: (parseFloat(inputs[category]) || 0) * 10000,
              year,
              month,
            }),
          })
        )
      )
      await mutate()
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Header title="チーム目標設定" subtitle="月間・週間目標の管理" />

      <div className="p-3 md:p-6 space-y-5">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">各カテゴリの月間目標金額を設定します</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
                  <ChevronLeft size={18} />
                </button>
                <span className="font-bold text-gray-900 text-lg min-w-[120px] text-center">
                  {year}年{month}月
                </span>
                <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-5">
              {CATEGORIES.map((category) => (
                <div key={category} className="space-y-1.5">
                  <label className="block">
                    <span className={`text-sm font-semibold ${CATEGORY_CONFIG[category].color}`}>
                      {category}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      {CATEGORY_CONFIG[category].description}
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={inputs[category]}
                      onChange={(e) => handleChange(category, e.target.value)}
                      placeholder="0"
                      className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <span className="text-sm text-gray-500">万円</span>
                    {inputs[category] && (
                      <span className="text-xs text-gray-400">
                        = {(parseFloat(inputs[category]) || 0).toLocaleString()}万円
                        （{((parseFloat(inputs[category]) || 0) * 10000).toLocaleString()}円）
                      </span>
                    )}
                  </div>
                </div>
              ))}

              <div className="pt-3 flex items-center gap-4">
                <Button onClick={handleSave} disabled={saving} size="lg">
                  {saving ? '保存中...' : '保存する'}
                </Button>
                {saved && (
                  <span className="text-sm text-green-600 font-medium">保存しました</span>
                )}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 現在の設定サマリー */}
        {Array.isArray(goals) && goals.length > 0 && (
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-800 text-sm">現在の目標設定</h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-3 gap-4">
                {CATEGORIES.map((category) => {
                  const goal = goals.find(
                    (g: { periodType: string; category: string; year: number; month: number; targetAmount: number }) =>
                      g.periodType === 'monthly' &&
                      g.category === category &&
                      g.year === year &&
                      g.month === month
                  )
                  return (
                    <div key={category} className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className={`text-sm font-semibold ${CATEGORY_CONFIG[category].color}`}>
                        {category}
                      </p>
                      <p className="text-xl font-bold text-gray-900 mt-1">
                        {goal ? Math.round(goal.targetAmount / 10000).toLocaleString() : '−'}
                        <span className="text-sm font-normal text-gray-500 ml-1">万円</span>
                      </p>
                    </div>
                  )
                })}
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </>
  )
}
