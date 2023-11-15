import { Suspense } from 'react'

import ManageLayout from '@/components/layouts/manage-layout'

import Sidebar from './sidebar'

interface IProps {
  children: React.ReactNode
  params: { app_id: string }
}

export default async function Layout({ children, params }: IProps) {
  const { app_id } = params

  return (
    <ManageLayout
      sidebar={
        <Suspense fallback={<Sidebar.Loading />}>
          <Sidebar appId={app_id} />
        </Suspense>
      }
    >
      {children}
    </ManageLayout>
  )
}
