'use client'

import { useSearchParams } from 'next/navigation'
import { CheckCircleIcon, CircleOffIcon } from 'lucide-react'

export default function Page() {
  const searchParams = useSearchParams()
  const status = searchParams?.get('status')
  const title = searchParams?.get('title')
  const desc = searchParams?.get('desc')

  return (
    <div className="h-screen bg-gray-100 pt-10">
      <div className="mx-auto flex max-w-md flex-col items-center gap-2 rounded bg-white p-6">
        {status === 'success' && (
          <CheckCircleIcon className="h-16 w-16 text-green-600" />
        )}
        {status === 'error' && (
          <CircleOffIcon className="h-16 w-16 text-red-600" />
        )}
        {title && (
          <h3 className="text-base font-semibold text-gray-900 md:text-2xl">
            {title}
          </h3>
        )}
        {desc && <p className="text-gray-600">{desc}</p>}
      </div>
    </div>
  )
}
