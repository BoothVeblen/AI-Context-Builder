interface IProps {
  sidebar: React.ReactNode
  children: React.ReactNode
}

export default function SidebarLayout({ sidebar, children }: IProps) {
  return (
    <div className="flex flex-1">
      <aside className="flex w-60 flex-col border-r border-slate-100">
        {sidebar}
      </aside>
      <main className="flex-1 overflow-y-auto px-8 py-6">{children}</main>
    </div>
  )
}
