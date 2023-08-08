import RootLayout from './root-layout'
import RootSidebar from './root-sidebar'

interface IProps {
  children: React.ReactNode
  pageTitle?: string
  nav?: React.ReactNode
}

export default function RootWrapper({ children, pageTitle, nav }: IProps) {
  return (
    <RootLayout
      sidebar={<RootSidebar title={pageTitle} nav={nav} />}
      pageTitle={pageTitle}
      mainClassnames="lg:pl-[312px]"
    >
      {children}
    </RootLayout>
  )
}
