import { PrismaClient } from '@prisma/client'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new (PrismaClient as any)({
  datasourceUrl: 'file:./dev.db',
})

async function main() {
  console.log('Seeding database...')

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const weekNum = Math.ceil(now.getDate() / 7)

  // ============================================================
  // メンバー（実際のCチームメンバー）
  // 赤=#ef4444 / 青=#3b82f6 / 黄=#f59e0b
  // ============================================================
  const memberData = [
    // 赤チーム
    { name: '多井中亨斗', email: 'tainakakouto@c.local',   color: '#ef4444', target: 10_000_000, category: 'AI' },
    { name: '長嶺真理菜',  email: 'naganemarina@c.local',   color: '#ef4444', target:  1_500_000, category: '物販' },
    { name: '樫見奎汰',    email: 'kashimiketa@c.local',    color: '#ef4444', target:  1_000_000, category: 'AI' },
    { name: '佐藤さくら',  email: 'satosakura@c.local',     color: '#ef4444', target:  1_500_000, category: '物販' },
    { name: '高橋雅幸',    email: 'takahashimasayuki@c.local', color: '#ef4444', target: 990_000, category: '物販' },
    { name: '秋田啓之',    email: 'akitahiroyuki@c.local',  color: '#ef4444', target:  1_500_000, category: '物販' },
    // 青チーム
    { name: '古屋希水',    email: 'furuyakimi@c.local',     color: '#3b82f6', target: 15_000_000, category: 'AI' },
    { name: '福田達志',    email: 'fukudatatsushi@c.local', color: '#3b82f6', target:  1_500_000, category: '物販' },
    { name: '福地雅哉',    email: 'fukuchimasa@c.local',    color: '#3b82f6', target: 10_000_000, category: 'AI' },
    { name: '宮城洋',      email: 'miyagihiro@c.local',     color: '#3b82f6', target:  7_000_000, category: '物販' },
    { name: '森井廉清',    email: 'moriirensei@c.local',    color: '#3b82f6', target:  7_000_000, category: '物販' },
    { name: '橋本沙彩',    email: 'hashimotosaa@c.local',   color: '#3b82f6', target: 10_000_000, category: 'AI' },
    { name: '鹿田有希',    email: 'shikatayuki@c.local',    color: '#3b82f6', target:  1_000_000, category: '物販' },
    { name: '西面正樹',    email: 'nishiomotemasaki@c.local', color: '#3b82f6', target: 9_000_000, category: 'AI' },
    { name: '高木菜央',    email: 'takaginao@c.local',      color: '#3b82f6', target:  2_500_000, category: '物販' },
    { name: '川合篤志',    email: 'kawaiatushi@c.local',    color: '#3b82f6', target:  5_000_000, category: '物販' },
    // 黄チーム
    { name: '中村賞子',    email: 'nakamurashouko@c.local', color: '#f59e0b', target: 10_000_000, category: '物販' },
    { name: '水場洋輔',    email: 'mizubayosuke@c.local',   color: '#f59e0b', target:  1_966_000, category: 'AI' },
    { name: '國方アイト',  email: 'kunikataaito@c.local',   color: '#f59e0b', target: 15_000_000, category: 'AI' },
    { name: '生駒彩花',    email: 'ikomasaika@c.local',     color: '#f59e0b', target:  4_000_000, category: '物販' },
    { name: '鈴木友也',    email: 'suzukitomoya@c.local',   color: '#f59e0b', target:  2_500_000, category: '物販' },
    { name: '袖野椋可',    email: 'sodenoryoka@c.local',    color: '#f59e0b', target:  7_000_000, category: '物販' },
    { name: '中村心咲',    email: 'nakamuramisaki@c.local', color: '#f59e0b', target:  3_000_000, category: '物販' },
    { name: '村山達哉',    email: 'murayamatatsuya@c.local',color: '#f59e0b', target:  1_500_000, category: 'AI' },
    { name: '冨樫拓海',    email: 'tomigatakumi@c.local',   color: '#f59e0b', target:    800_000, category: 'AI' },
    { name: '大塚裕翔',    email: 'otsukayusho@c.local',    color: '#f59e0b', target:  2_500_000, category: '物販' },
    { name: '末野敦也',    email: 'suenoatsuya@c.local',    color: '#f59e0b', target:  1_200_000, category: 'AI' },
  ]

  for (const m of memberData) {
    await prisma.member.upsert({
      where: { email: m.email },
      update: { name: m.name, avatarColor: m.color, targetAmount: m.target, category: m.category },
      create: { name: m.name, email: m.email, avatarColor: m.color, targetAmount: m.target, category: m.category },
    })
  }

  console.log(`${memberData.length}名のメンバーを登録しました`)

  // ============================================================
  // チーム目標（年間/月間/週間）
  // 物販3億・AI7億・総合10億
  // ============================================================
  const goals = [
    { periodType: 'annual',  category: '総合', year, month: 0, week: 0, targetAmount: 1_000_000_000 },
    { periodType: 'annual',  category: '物販', year, month: 0, week: 0, targetAmount:   300_000_000 },
    { periodType: 'annual',  category: 'AI',   year, month: 0, week: 0, targetAmount:   700_000_000 },
    { periodType: 'monthly', category: '総合', year, month, week: 0, targetAmount:  83_000_000 },
    { periodType: 'monthly', category: '物販', year, month, week: 0, targetAmount:  30_000_000 },
    { periodType: 'monthly', category: 'AI',   year, month, week: 0, targetAmount:  70_000_000 },
    { periodType: 'weekly',  category: '総合', year, month, week: weekNum, targetAmount: Math.round(83_000_000 / 4) },
    { periodType: 'weekly',  category: '物販', year, month, week: weekNum, targetAmount: Math.round(30_000_000 / 4) },
    { periodType: 'weekly',  category: 'AI',   year, month, week: weekNum, targetAmount: Math.round(70_000_000 / 4) },
  ]

  for (const g of goals) {
    await prisma.teamGoal.upsert({
      where: { periodType_category_year_month_week: { periodType: g.periodType, category: g.category, year: g.year, month: g.month ?? 0, week: g.week ?? 0 } },
      update: { targetAmount: g.targetAmount },
      create: g,
    })
  }

  console.log('Seeding complete!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
