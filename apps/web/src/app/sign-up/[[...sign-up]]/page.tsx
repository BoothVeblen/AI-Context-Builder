import { SignUp } from '@clerk/nextjs'

import { getFlags } from '@/lib/flags'
import AuthLayout from '@/components/auth-layout'

export default function Page() {
  const { enabledAuth } = getFlags()

  if (!enabledAuth) return null

  return (
    <AuthLayout>
      <SignUp />
    </AuthLayout>
  )
}
