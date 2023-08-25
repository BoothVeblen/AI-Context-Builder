'use client'

import { useCallback } from 'react'
import { TooltipTrigger } from '@radix-ui/react-tooltip'
import { Clock, Code2, ThumbsDown, ThumbsUp } from 'lucide-react'
import useSWRMutation from 'swr/mutation'

import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent } from '@/components/ui/tooltip'

import { useChatContext } from '../chat-context'
import { ChatMessage } from '../types'
import { useChatFeedbackContext } from './chat-feedback-context'
import submitFeedback from './service'
import { ChatFeedbackType } from './types'

type Props = {
  message: ChatMessage
}

const commonButtonProps = {
  size: 16,
  strokeWidth: 3,
} as const

const ChatFeedbackButtons = (props: Props) => {
  const { message } = props
  const { id, feedback, feedback_content, meta } = message
  const { latency, token, raw } = meta || {}
  const { session, mode } = useChatContext()
  const { short_id: session_id } = session || {}

  const { toggleFeedback, feedbacked } = useChatFeedbackContext()

  const { trigger } = useSWRMutation('/api/chat/feedback', submitFeedback)

  const handleClick = useCallback(
    (type: ChatFeedbackType) => () => {
      if (id) {
        trigger({
          message_id: id,
          type,
          session_id,
        })

        toggleFeedback(id, type)
      }
    },
    [id, toggleFeedback, session_id, trigger]
  )

  const renderButton = useCallback(
    (type: ChatFeedbackType, clickable: boolean) => {
      const compMap = {
        good: ThumbsUp,
        bad: ThumbsDown,
      } as const

      const Comp = compMap[type]

      let color = 'stroke-slate-400'
      if (!clickable) {
        if (type === 'good') {
          color = 'stroke-green-500'
        }
        if (type === 'bad') {
          color = 'stroke-red-500'
        }
      }

      return (
        <div
          className={cn(
            'ml-1 rounded-md border bg-white p-2',
            clickable && 'cursor-pointer hover:bg-slate-100 active:bg-slate-300'
          )}
          {...(clickable
            ? {
                onClick: handleClick(type),
              }
            : {})}
        >
          <Comp {...commonButtonProps} className={color} />
        </div>
      )
    },
    [handleClick]
  )

  if (!id) {
    return null
  }

  const status = feedback || feedbacked[id]

  // todo refactor
  if (mode === 'history') {
    let button
    if (feedback === 'good') {
      button = renderButton('good', false)
    } else if (feedback === 'bad') {
      button = renderButton('bad', false)
    }
    if (feedback_content) {
      button = (
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="bottom" className="p-4">
            {feedback_content}
          </TooltipContent>
        </Tooltip>
      )
    }

    return (
      <>
        {button}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="ml-1 rounded-md border bg-white p-2">
              <Code2 {...commonButtonProps} className="stroke-slate-400" />
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            className="min-h-10 max-h-96 w-96 space-y-3 p-4"
          >
            <div className="font-medium">API request detail:</div>

            <div className="flex items-center space-x-2">
              {latency && (
                <>
                  <Clock size={18} />
                  <div className="font-medium">
                    {(latency / 1000).toPrecision(3)}s
                  </div>
                </>
              )}
              {latency && token && <div className="px-2 font-medium">|</div>}
              {token && <div className="text-slate-500">{token} tokens</div>}
            </div>
            {raw && (
              <div className="rounded-lg bg-slate-100 p-2">
                <pre className="max-h-40 overflow-y-scroll whitespace-pre-wrap break-all">
                  {JSON.stringify(raw, null, 2)}
                </pre>
              </div>
            )}
          </TooltipContent>
        </Tooltip>
      </>
    )
  }

  return (
    <>
      {!status && (
        <>
          {renderButton('good', true)}
          {renderButton('bad', true)}
        </>
      )}
      {status === 'good' && renderButton('good', false)}
      {status === 'bad' && renderButton('bad', false)}
    </>
  )
}

export default ChatFeedbackButtons
