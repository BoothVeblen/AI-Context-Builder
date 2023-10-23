'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { MenuIcon, XIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useSidebarStore } from '@/store/sidebar'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'

interface IProps {
  children: React.ReactNode
  defaultPageTitle?: string
}

export default function NavSheet({ children, defaultPageTitle }: IProps) {
  const path = usePathname() || ''
  const { isOpen, setIsOpen, pageTitle: pageTitleFromStore } = useSidebarStore()

  const pageTitle = pageTitleFromStore || defaultPageTitle

  React.useEffect(() => {
    setIsOpen(false)
  }, [path, setIsOpen])

  return (
    <div className="fixed inset-x-0 top-0 z-40 flex h-12 shrink basis-12 items-center gap-x-6 bg-white px-4 shadow-sm sm:px-6 lg:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger className="-m-2.5 p-2.5 text-gray-700 lg:hidden">
          <span className="sr-only">Open sidebar</span>
          <MenuIcon className="h-6 w-6" aria-hidden="true" />
        </SheetTrigger>
        <SheetContent side="left" className="flex w-auto gap-0 p-0">
          {children}
          <SheetClose
            className={cn(
              'absolute -right-8 top-4 rounded-sm opacity-0 ring-offset-background transition-opacity data-[state=open]:bg-secondary hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none',
              isOpen && 'opacity-70'
            )}
          >
            <XIcon className="h-4 w-4" />
            <span className="sr-only">Close sidebar</span>
          </SheetClose>
        </SheetContent>
      </Sheet>
      {pageTitle && (
        <div className="text-sm font-medium leading-6 text-gray-900">
          {pageTitle}
        </div>
      )}
    </div>
  )
}
