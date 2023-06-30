import { ClerkProvider } from '@clerk/nextjs'

import { flags } from '@/lib/flags'

import { TooltipProvider } from './ui/tooltip'

interface IProps {
  children: React.ReactNode
}

function AuthProvider({ children }: IProps) {
  if (flags.enabledAuth) {
    return <ClerkProvider>{children}</ClerkProvider>
  }

  return children
}

export default function Provider({ children }: IProps) {
  return (
    <AuthProvider>
      <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
    </AuthProvider>
  )
}
