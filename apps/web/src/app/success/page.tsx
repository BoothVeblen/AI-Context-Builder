'use client'

import { useEffect } from 'react'
import { CheckCircle2Icon } from 'lucide-react'

export default function Page() {
  useEffect(() => {
    window.close()
  }, [])

  return (
    <div className="h-screen bg-gray-100 pt-10">
      <div className="mx-auto flex max-w-md flex-col items-center gap-2 rounded bg-white p-6">
        <CheckCircle2Icon className="h-16 w-16 text-green-600" />
        <h3 className="text-base font-semibold text-gray-900 md:text-2xl">
          Success
        </h3>
        <p className=" text-gray-600">You can close this page</p>
      </div>
    </div>
  )
}
