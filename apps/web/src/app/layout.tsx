import './globals.css'

import { Metadata, Viewport } from 'next'

import Provider from '@/components/provider'

export const metadata: Metadata = {
  title: 'Context Builder',
  description: 'Turn AI app development into clicks, no coding skills required',
}

export const viewport: Viewport = {
  themeColor: 'black',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="h-full">
        <Provider>{children}</Provider>
      </body>
    </html>
  )
}
