import AuthButton from '@/components/auth-button'

interface IProps {
  title?: string
  children?: React.ReactNode
}

export default function NavSidebar({ title, children }: IProps) {
  return (
    <div className="flex h-full w-60 shrink-0 grow flex-col bg-gray-50">
      <div className="flex-1 overflow-y-auto scrollbar-none">
        <h1 className="flex h-12 shrink-0 items-center px-4 text-lg font-semibold">
          {title}
        </h1>
        <div className="m-full h-px shrink-0 bg-slate-200" />
        <div className="flex-1 px-2 py-3">
          <div className="space-y-3">
            <div className="space-y-3">{children}</div>
          </div>
        </div>
      </div>
      <AuthButton />
    </div>
  )
}
