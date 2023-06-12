import Link from 'next/link'

import UploadInput from './upload-input'

export default function DashboardPage() {
  return (
    <div className="p-2">
      <h1>Dashboard Page</h1>
      <Link
        href="/about"
        className="text-blue-600 hover:underline dark:text-blue-500"
      >
        About
      </Link>
      <UploadInput />
    </div>
  )
}
