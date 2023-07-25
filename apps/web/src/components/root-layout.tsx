import RootSheet from './root-sheet'

interface IProps {
  sidebar: React.ReactNode
  children: React.ReactNode
  pageTitle?: string
  mainClassnames?: string
}

export default function RootLayout({
  sidebar,
  children,
  pageTitle,
  mainClassnames,
}: IProps) {
  return (
    <>
      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:flex-col">
        {sidebar}
      </div>

      {/* Float sidebar for mobile */}
      <RootSheet defaultPageTitle={pageTitle}>{sidebar}</RootSheet>

      {/* Page content for desktop and mobile */}
      <main className={mainClassnames}>{children}</main>
    </>
  )
}
