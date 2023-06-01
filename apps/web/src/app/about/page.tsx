import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="p-2">
      <h1>About Page</h1>
      <Link
        href="/dashboard"
        className="text-blue-600 hover:underline dark:text-blue-500"
      >
        Dashboard~
      </Link>
    </div>
  )
}
