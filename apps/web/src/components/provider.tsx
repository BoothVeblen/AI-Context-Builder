import { ClerkProvider } from '@clerk/nextjs'
import { Analytics } from '@vercel/analytics/react'

import ClientProvider from './provider-client'
import { ThemeProvider } from './theme-provider'
import { Toaster } from './ui/toaster'

interface IProps {
  children: React.ReactNode
}

export default function Provider({ children }: IProps) {
  return (
    <ClerkProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <ClientProvider>{children}</ClientProvider>
        <Toaster />
        <Analytics />
      </ThemeProvider>
    </ClerkProvider>
  )
}
