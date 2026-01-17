import type { Metadata } from 'next'
import { Inter, Baloo_2 } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })
const baloo = Baloo_2({ 
  subsets: ['latin'],
  variable: '--font-baloo',
  weight: ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'restyjob - On-demand Marketplace Platform',
  description: 'Kết nối lao động thời vụ với doanh nghiệp',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body className={`${inter.className} ${baloo.variable}`}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}

