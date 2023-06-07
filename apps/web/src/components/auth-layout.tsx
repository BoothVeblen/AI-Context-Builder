interface IProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: IProps) {
  return (
    <div className="fixed inset-0 flex min-h-full flex-1 flex-col justify-center">
      <div className="m-auto">{children}</div>
    </div>
  )
}
