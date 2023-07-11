import RootLayout from './root-layout'
import RootSidebar from './root-sidebar'

interface IProps {
  children: React.ReactNode
  pageTitle?: string
}

export default function RootWrapper({ children, pageTitle }: IProps) {
  return (
    <RootLayout
      sidebar={<RootSidebar />}
      pageTitle={pageTitle}
      mainClassnames="lg:pl-[312px]"
    >
      {children}
    </RootLayout>
  )
}
