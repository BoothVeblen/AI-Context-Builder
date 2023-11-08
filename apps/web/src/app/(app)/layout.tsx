import { PropsWithChildren } from 'react'

import AppLayout from '@/components/layouts/app-layout'

export const runtime = 'edge'

const Layout = ({ children }: PropsWithChildren) => {
  return <AppLayout>{children}</AppLayout>
}

export default Layout
