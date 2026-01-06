import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/context/auth-context'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Cavgo',
  description: 'Cavgo fleet platform',
  generator: 'cavgo.app',
  icons: {
    icon: [
      {
        url: '/logo.webp',
        type: 'image/webp',
      },
    ],
    apple: '/logo.webp',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${_geist.className} ${_geistMono.variable} font-sans antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
