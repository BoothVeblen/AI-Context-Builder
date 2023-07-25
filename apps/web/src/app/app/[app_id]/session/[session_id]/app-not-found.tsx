'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const AppNotFound = ({ archived }: { archived: boolean }) => {
  const [open, setOpen] = React.useState(archived)
  const [_, startTransition] = React.useTransition()

  const router = useRouter()
  // shared app is removed
  const handleOk = () => {
    startTransition(() => {
      router.push('/explore')
      setOpen(false)
    })
  }
  return (
    <div>
      <AlertDialog open={open}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>App not Found</AlertDialogTitle>
            <AlertDialogDescription>
              This app has been deleted by the author.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleOk}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default AppNotFound
