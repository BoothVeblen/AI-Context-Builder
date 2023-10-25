'use client'

import { useMemo } from 'react'
import { useUser } from '@clerk/nextjs'
import { Loader2, PhoneCallIcon, PhoneIcon } from 'lucide-react'

import {
  cn,
  formatSeconds,
  formatTime,
  getAvatarBgColor,
  getFirstLetter,
} from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

import Text from '../../ui/text'
import { Markdown } from '../markdown/markdown'
import { ChatUser } from '../types'
import { useChat } from '../useChat'
import { IChatCardProps } from './chat-card'

interface Props extends IChatCardProps {
  actions?: React.ReactNode
  footer?: React.ReactNode
}

function formatUser(user?: ChatUser | null) {
  if (user == null) return {}
  return {
    firstName: user.first_name,
    lastName: user.last_name,
    imageUrl: user.image_url,
  }
}

const AlertErrorIcon = ({ className }: { className: string }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="9" cy="9" r="9" fill="#EF4444" />
    <g clipPath="url(#clip0_1056_7239)">
      <path
        d="M9.00016 15.6667C12.6821 15.6667 15.6668 12.6819 15.6668 9.00004C15.6668 5.31814 12.6821 2.33337 9.00016 2.33337C5.31826 2.33337 2.3335 5.31814 2.3335 9.00004C2.3335 12.6819 5.31826 15.6667 9.00016 15.6667Z"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 6.33337V9.00004"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 11.6666H9.00667"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <defs>
      <clipPath id="clip0_1056_7239">
        <rect width="16" height="16" fill="white" transform="translate(1 1)" />
      </clipPath>
    </defs>
  </svg>
)

function EventMessage({ data }: { data: any }) {
  let icon
  let message

  switch (data.eventType) {
    case 'basic.opening_remarks': {
      message = data.content
      break
    }
    case 'call.created': {
      icon = <PhoneCallIcon className="mr-4" />
      message = 'Call Requested'
      break
    }
    case 'call.declined': {
      icon = <PhoneIcon className="mr-4 rotate-[135deg]" />
      message = 'Call Declined'
      break
    }
    case 'call.ended': {
      icon = <PhoneIcon className="mr-4 rotate-[135deg]" />
      message = `Call Ended ${formatSeconds(+data.call_duration || 0)}`
      break
    }
    case 'call.canceled': {
      icon = <PhoneIcon className="mr-4 rotate-[135deg]" />
      message = 'Call Canceled'
      break
    }
    default: {
      message = data.content ? data.content : 'Unknown event'
    }
  }

  if (icon) {
    return (
      <div className="flex items-center text-sm">
        {icon}
        {message}
      </div>
    )
  }

  return <Markdown className="text-black">{message}</Markdown>
}

const ChatCardLayout = (prop: Props) => {
  const { isEnd, error, message, actions, footer } = prop
  const { app, mode, user: chatUser } = useChat()
  const { short_id: appId, icon: appIcon, name: appName } = app ?? {}
  const isUser = message.role === 'user'
  const showError = isEnd && error && !isUser

  const { user: currentUser } = useUser()

  const user = mode === 'debug' ? currentUser : formatUser(chatUser)

  const username = [user?.firstName || '', user?.lastName || '']
    .join(' ')
    .trim()
  const icon = isUser ? user?.imageUrl : appIcon
  const name = (isUser ? username : appName) || ''
  const color = getAvatarBgColor(appId || '')

  const renderContent = useMemo(() => {
    const { type } = message
    if (type === 'event') {
      return <EventMessage data={message} />
    }
    const { content } = message
    if (showError) {
      return <Markdown isUser={isUser}>{error}</Markdown>
    }
    if (!content) {
      return (
        <Loader2
          className="h-3 w-3 animate-spin"
          data-testid="chat-card-loading"
        />
      )
    }
    return <Markdown isUser={isUser}>{content}</Markdown>
  }, [isUser, message, showError, error])

  return (
    <div className="flex flex-col ">
      <div className="flex gap-2 ">
        <div className="relative h-14 w-14">
          <Avatar
            className={cn(
              'relative h-12 w-12',
              icon ? 'bg-white' : `bg-${color}-600`
            )}
          >
            {icon && (
              <img
                src={icon}
                alt={name}
                className="aspect-square h-full w-full object-cover"
              />
            )}
            <AvatarFallback className="bg-transparent text-white">
              {getFirstLetter(name)}
            </AvatarFallback>
          </Avatar>
          {showError && (
            <AlertErrorIcon className="absolute bottom-0 right-3" />
          )}
        </div>

        <div className={cn('flex flex-col')}>
          <div className="mb-5 flex items-center gap-1">
            <Text variant="body2">{isUser ? 'Me' : appName}</Text>
            {message.createdAt && (
              <Text variant="caption">
                {formatTime(new Date(message.createdAt))}
              </Text>
            )}
          </div>
          <div className="flex items-end">
            <div
              className={cn(
                'relative max-w-[280px] rounded-lg p-4 sm:max-w-xs md:max-w-lg	lg:max-w-3xl xl:max-w-3xl',
                mode === 'debug' &&
                  'max-w-[240px] md:max-w-md lg:max-w-md xl:max-w-md',
                isUser ? 'bg-primary' : 'bg-gray-100',
                showError ? 'rounded-lg border border-red-500	bg-red-50' : ''
              )}
              data-testid="chat-card-content"
            >
              {renderContent}
              {!showError && (
                <div className="absolute bottom-full left-full flex -translate-x-14 translate-y-4">
                  {actions}
                </div>
              )}
              {footer}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatCardLayout
