'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { LogIn } from 'lucide-react'

export default function LoginLink() {
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null)

  const href = useMemo(() => {
    if (!redirectUrl) return '/sign-in'
    return `/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`
  }, [redirectUrl])

  useEffect(() => {
    setRedirectUrl(window.location.href)
  }, [])

  return (
    <Link
      href={href}
      className="flex h-full flex-1 items-center space-x-2 px-4"
    >
      <LogIn />
      <p className="pl-6 text-sm font-medium">Log In</p>
    </Link>
  )
}
