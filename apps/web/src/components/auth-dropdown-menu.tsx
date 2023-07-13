'use client'

import * as React from 'react'
import { SignOutButton, UserProfile } from '@clerk/nextjs'
import { Loader2Icon, LogOutIcon, SettingsIcon } from 'lucide-react'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface IProps {
  children: React.ReactNode
}

export default function AuthDropdownMenu({ children }: IProps) {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)
  const [isProfileOpen, setIsProfileOpen] = React.useState(false)
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)

  return (
    <>
      <DropdownMenu
        open={isDropdownOpen}
        onOpenChange={(open) => {
          if (isLoggingOut) return
          setIsDropdownOpen(open)
        }}
      >
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent className="w-52">
          <DropdownMenuItem onClick={() => setIsProfileOpen(true)}>
            <SettingsIcon className="mr-2 h-4 w-4" />
            <span>Manage account</span>
          </DropdownMenuItem>
          <SignOutButton>
            <DropdownMenuItem onClick={() => setIsLoggingOut(true)}>
              {isLoggingOut ? (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOutIcon className="mr-2 h-4 w-4" />
              )}
              <span>Sign out</span>
            </DropdownMenuItem>
          </SignOutButton>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="max-h-screen overflow-auto p-0 sm:max-h-[90vh] sm:max-w-fit sm:p-6">
          <UserProfile />
        </DialogContent>
      </Dialog>
    </>
  )
}
