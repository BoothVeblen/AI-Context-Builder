'use client'

import { Message } from 'ai'
import { format, isToday, isYesterday } from 'date-fns'
import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

import Text from '../ui/text'
import { Markdown } from './markdown/markdown'

interface IProps {
  message?: Message
  error?: string
  model_avatar?: string
  user_avatar?: string
  isEnd?: boolean
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
    <g clip-path="url(#clip0_1056_7239)">
      <path
        d="M9.00016 15.6667C12.6821 15.6667 15.6668 12.6819 15.6668 9.00004C15.6668 5.31814 12.6821 2.33337 9.00016 2.33337C5.31826 2.33337 2.3335 5.31814 2.3335 9.00004C2.3335 12.6819 5.31826 15.6667 9.00016 15.6667Z"
        stroke="white"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M9 6.33337V9.00004"
        stroke="white"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M9 11.6666H9.00667"
        stroke="white"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </g>
    <defs>
      <clipPath id="clip0_1056_7239">
        <rect width="16" height="16" fill="white" transform="translate(1 1)" />
      </clipPath>
    </defs>
  </svg>
)

const formatTime = (time: number) => {
  if (isToday(time)) {
    return format(time, 'kk:mm aa')
  }
  if (isYesterday(time)) {
    return `Yesterday at ${format(time, 'kk:mm aa')}`
  } else return format(time, 'dd/MM/yyyy kk:mm aa')
}

const ChatCard = (props: IProps) => {
  const { message, model_avatar, user_avatar, error = '', isEnd } = props
  const isUser = message?.role === 'user'
  const showError = isEnd && error && !isUser
  return (
    <div className="flex flex-col ">
      <div className="flex gap-2 ">
        <div className="relative h-14 w-14">
          <Avatar className="relative h-12 w-12">
            <AvatarImage
              src={!isUser ? model_avatar : user_avatar}
              alt="@shadcn"
            />
            <AvatarFallback>AI</AvatarFallback>
          </Avatar>
          {showError && (
            <AlertErrorIcon className="absolute bottom-0 right-3" />
          )}
        </div>

        <div className={cn('flex flex-col')}>
          <div className="mb-5 flex items-center gap-1">
            <Text variant="body2">{isUser ? 'Me' : 'AI Assistant'}</Text>
            <Text variant="caption">
              {message?.createdAt && formatTime(Number(message?.createdAt))}
            </Text>
          </div>
          <div className="flex items-end">
            <div
              className={cn(
                'rounded-lg p-4 text-sm sm:max-w-full md:max-w-full lg:max-w-3xl	xl:max-w-3xl',
                isUser ? 'bg-primary' : 'bg-gray-100',
                showError ? 'rounded-lg border border-red-500	bg-red-50' : ''
              )}
            >
              {message?.content ? (
                <Markdown className={cn(isUser ? 'text-white' : 'text-black	')}>
                  {message?.content}
                </Markdown>
              ) : (
                <Loader2 className="h-3 w-3 animate-spin" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatCard
