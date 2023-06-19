import Link from 'next/link'
import { Plus } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function AppSidebar() {
  return (
    <>
      <div className="mt-6 flex shrink-0 items-center justify-center">
        <Link href="/">
          <Avatar className="h-12 w-12 bg-white">
            <AvatarImage src="https://github.com/withcontext-ai.png" />
            <AvatarFallback>CO</AvatarFallback>
          </Avatar>
        </Link>
      </div>
      <div className="m-auto mt-6 h-px w-14 bg-slate-200" />
      <nav className="no-scrollbar overflow-y-auto py-6">
        <ul role="list" className="flex flex-col items-center space-y-4">
          <li>
            <Link href="/app/lzl">
              <Avatar className="h-12 w-12 bg-white">
                <AvatarImage src="https://github.com/lzl.png" />
                <AvatarFallback>LZL</AvatarFallback>
              </Avatar>
            </Link>
          </li>
          <li>
            <Link href="/app/shadcn">
              <Avatar className="h-12 w-12 bg-white">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            </Link>
          </li>
          {[...Array(10)].map((_, i) => (
            <li key={i}>
              <Link href={`/app/a${i}`}>
                <Avatar className="h-12 w-12 bg-white">
                  <AvatarFallback>A{i}</AvatarFallback>
                </Avatar>
              </Link>
            </li>
          ))}
          <li>
            <Avatar className="h-12 w-12">
              <AvatarFallback className=" bg-white">
                <Plus />
              </AvatarFallback>
            </Avatar>
          </li>
        </ul>
      </nav>
    </>
  )
}
