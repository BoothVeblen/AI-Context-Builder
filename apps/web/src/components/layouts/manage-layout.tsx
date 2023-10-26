interface IProps {
  children: React.ReactNode
  sidebar: React.ReactNode
}

export default function ManageLayout({ children, sidebar }: IProps) {
  return (
    <div className="fixed inset-0 z-50 flex h-full w-full bg-white">
      <div className="w-[276px] shrink-0 border-r border-slate-200 bg-slate-50">
        {sidebar}
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  )
}
