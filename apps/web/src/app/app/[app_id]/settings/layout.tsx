import Sidebar from './sidebar'

interface IProps {
  children: React.ReactNode
  params: { app_id: string }
}

export default function SettingsLayout({ children, params }: IProps) {
  const { app_id } = params

  return (
    <div className="fixed inset-0 flex h-full w-full bg-white">
      <div className="w-[276px] shrink-0 border-r border-slate-200 bg-slate-50">
        <Sidebar />
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}
