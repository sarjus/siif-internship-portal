import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta-sans',
  weight: ['400', '500', '600', '700', '800']
})

export const metadata: Metadata = {
  title: 'INTERNx SIIF - Intership Portal',
  description: 'A modern internship management portal for incubators, companies, and students.',
  icons: {
    icon: '/SIIF%20Logo%20Icon.png',
    shortcut: '/SIIF%20Logo%20Icon.png',
    apple: '/SIIF%20Logo%20Icon.png'
  }
}

export default function RootLayout ({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={jakartaSans.variable}>
      <body>{children}</body>
    </html>
  )
}
