'use client'

import { useModal } from '@ebay/nice-modal-react'
import { TooltipPortal, TooltipTrigger } from '@radix-ui/react-tooltip'
import { Code2, PenLine, ThumbsDown, ThumbsUp } from 'lucide-react'

import { Tooltip, TooltipContent } from '@/components/ui/tooltip'

import ChatAction, { actionCommonButtonProps } from '../chat-action'
import { ChatMessage } from '../types'
import chatFeedbackDetailDialog from './chat-feedback-detail-dialog'

type Props = {
  message: ChatMessage
  annotating: boolean
  onAnnotate: () => void
}

const ChatFeedbackHistory = (props: Props) => {
  const { message, annotating, onAnnotate } = props
  const { id, feedback, feedback_content, meta } = message
  const { latency, token, raw } = meta || {}
  const { total_tokens } = token || {}
  const modal = useModal(chatFeedbackDetailDialog)
  if (!id) {
    return null
  }

  const Comp = feedback === 'good' ? ThumbsUp : ThumbsDown
  const color = feedback === 'good' ? 'stroke-green-500' : 'stroke-red-500'

  return (
    <>
      <Tooltip>
        <TooltipTrigger>
          <ChatAction
            onClick={() =>
              modal.show({
                latency,
                total_tokens,
                raw,
              })
            }
          >
            <Code2 {...actionCommonButtonProps} />
          </ChatAction>
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent side="bottom">API Request Detail</TooltipContent>
        </TooltipPortal>
      </Tooltip>
      {message.feedback && (
        <Tooltip>
          <TooltipTrigger>
            <ChatAction>
              <Comp {...actionCommonButtonProps} className={color} />
            </ChatAction>
          </TooltipTrigger>
          <TooltipPortal>
            <TooltipContent
              side="bottom"
              className="max-w-lg space-y-3 break-words p-4"
            >
              <div className="font-semibold">
                {feedback === 'good' && 'User liked this'}
                {feedback === 'bad' && 'User disliked this'}
                {feedback_content && ':'}
              </div>
              {feedback_content
                ?.split('\n')
                .map((line, index) => <div key={index}>{line}</div>)}
            </TooltipContent>
          </TooltipPortal>
        </Tooltip>
      )}
      <Tooltip>
        <TooltipTrigger>
          <ChatAction
            // only allow clicking when not already annotating
            {...(!annotating
              ? {
                  onClick: onAnnotate,
                }
              : {})}
          >
            <PenLine {...actionCommonButtonProps} />
          </ChatAction>
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent side="bottom">Annotate</TooltipContent>
        </TooltipPortal>
      </Tooltip>
    </>
  )
}

export default ChatFeedbackHistory
