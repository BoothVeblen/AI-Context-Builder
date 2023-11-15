import { PropsWithChildren } from 'react'

export default function CardLayout({ children }: PropsWithChildren) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {children}
    </div>
  )
}
