import type { Metadata } from 'next'
import { Inter, Black_Ops_One } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/layout/Sidebar'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const blackOps = Black_Ops_One({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-black-ops',
})

export const metadata: Metadata = {
  title: 'Cチームぶち上げ管理',
  description: 'Cチームぶち上げ管理',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={`${inter.variable} ${blackOps.variable} ${inter.className} bg-gray-950 text-gray-900 antialiased`}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 min-w-0 overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
