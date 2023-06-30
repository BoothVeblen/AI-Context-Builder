import './globals.css'

import { auth } from '@/lib/auth'
import { getWorkspace } from '@/db/workspace/actions'
import { Toaster } from '@/components/ui/toaster'
import AppLayout from '@/components/app-layout'
import AppSidebar from '@/components/app-sidebar'
import Provider from '@/components/provider'

export const metadata = {
  title: 'Context Builder',
  description: 'Generated by create next app',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = auth()
  const appList = await getWorkspace()

  return (
    <Provider>
      <html lang="en" className="h-full">
        <body className="h-full">
          <AppLayout sidebar={userId ? <AppSidebar appList={appList} /> : null}>
            {children}
          </AppLayout>
          <Toaster />
        </body>
      </html>
    </Provider>
  )
}
