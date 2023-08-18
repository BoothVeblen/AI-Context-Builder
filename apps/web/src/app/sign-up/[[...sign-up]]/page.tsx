import { SignUp } from '@clerk/nextjs'

import { flags } from '@/lib/flags'
import AuthLayout from '@/components/auth-layout'

export const runtime = 'edge'

export default function Page() {
  if (!flags.enabledAuth) return null

  return (
    <AuthLayout>
      <SignUp />
    </AuthLayout>
  )
}
