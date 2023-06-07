import { SignUp } from '@clerk/nextjs'

import AuthLayout from '@/components/auth-layout'

export default function Page() {
  return (
    <AuthLayout>
      <SignUp />
    </AuthLayout>
  )
}
