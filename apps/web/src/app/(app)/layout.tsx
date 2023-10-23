import { PropsWithChildren } from 'react'

import AppLayout from '@/components/layouts/app-layout'

const Layout = ({ children }: PropsWithChildren) => {
  return <AppLayout>{children}</AppLayout>
}

export default Layout
