import * as React from 'react'
import { PhoneCallIcon, PhoneIcon } from 'lucide-react'
import { useCountdown } from 'usehooks-ts'

import { cn, getAvatarBgColor, getFirstLetter } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

import { useChatContext } from './chat-context'

const COUNT_DOWN_NUM = 10

interface IProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAccept: () => void
  onDecline: () => void
  onCancel: () => void
}

function Content({
  open,
  onAccept,
  onDecline,
  onCancel,
}: Omit<IProps, 'onOpenChange'>) {
  const { app } = useChatContext()
  const { short_id: appId, icon: appIcon, name: appName } = app ?? {}
  const color = getAvatarBgColor(appId || '')

  const [count, { startCountdown }] = useCountdown({
    countStart: COUNT_DOWN_NUM,
  })

  React.useEffect(() => {
    if (open) startCountdown()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  React.useEffect(() => {
    if (count === 0) onCancel()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count])

  return (
    <AlertDialogContent className="gap-6 sm:max-w-[268px]">
      <AlertDialogHeader className="space-y-4">
        <AlertDialogTitle>
          <div className="flex items-center space-x-4">
            <Avatar
              className={cn(
                'relative h-12 w-12',
                appIcon ? 'bg-white' : `bg-${color}-600`
              )}
            >
              <AvatarImage
                src={appIcon}
                alt={appName}
                className="object-cover"
              />
              {appName && (
                <AvatarFallback className="bg-transparent text-white">
                  {getFirstLetter(appName)}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="font-medium">{appName}</div>
          </div>
        </AlertDialogTitle>
        <AlertDialogDescription>
          I want to communicate with you via video call, please accept.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <div className="flex justify-between">
        <Button
          className="bg-green-600 hover:bg-green-600/90 focus-visible:ring-green-600"
          onClick={onAccept}
        >
          <PhoneCallIcon className="mr-2 h-4 w-4" />
          Accept
        </Button>
        <Button
          className="bg-red-600 hover:bg-red-600/90 focus-visible:ring-red-600"
          onClick={onDecline}
        >
          <PhoneIcon className="mr-2 h-4 w-4" />
          Decline
        </Button>
      </div>
    </AlertDialogContent>
  )
}

export default function VideoCallConfirmDialog({
  open,
  onOpenChange,
  onAccept,
  onDecline,
  onCancel,
}: IProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(open) => open && onOpenChange(open)}
    >
      {open && (
        <Content
          open={open}
          onAccept={onAccept}
          onDecline={onDecline}
          onCancel={onCancel}
        />
      )}
    </AlertDialog>
  )
}
