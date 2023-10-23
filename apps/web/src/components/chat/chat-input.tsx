'use client'

import * as React from 'react'
import { Loader2, RefreshCw, StopCircle } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useEnterSubmit } from '@/hooks/use-enter-submit'
import useSubmitHandler from '@/hooks/use-submit-handler'

import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { useChat } from './useChat'

interface InputProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  showResend?: boolean
  onReload: () => void
  onStop: () => void
}

const ChatInput = ({ onSubmit, showResend, onReload, onStop }: InputProps) => {
  const { handleInputChange, loading, input, error, mode } = useChat()
  const isDebug = mode === 'debug'

  const { formRef, onKeyDown } = useEnterSubmit()
  const { shouldSubmit } = useSubmitHandler()

  const set = new Set(input?.split(''))
  const isEmpty = set?.size === 1 && set.has('\n')
  const disabled = isEmpty || !input || !input?.trim() || loading

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!disabled) onSubmit(e)
  }

  return (
    <div
      className={cn(
        'relative flex w-full flex-col gap-4',
        isDebug ? '' : 'px-6 pb-4'
      )}
    >
      <div className="absolute bottom-18 -ml-6 flex w-full flex-col items-center justify-start">
        {error && (
          <div className="pb-4 text-[14px] font-medium">
            There was an error generating a response
          </div>
        )}
        {(Boolean(error?.message) || (showResend && !loading)) && (
          <Button className="bg-white" onClick={onReload} variant="outline">
            <RefreshCw size={16} className="mr-2" />
            Regenerate response
          </Button>
        )}
        {loading && !error && (
          <Button
            className="bg-white"
            onClick={onStop}
            variant="outline"
            data-testid="stop"
          >
            <StopCircle size={16} className="mr-2" />
            Stop generating
          </Button>
        )}
      </div>
      {!error && (
        <form onSubmit={handleSubmit} ref={formRef}>
          <div className="flex justify-between space-x-2">
            <Textarea
              className="min-h-[40px]"
              placeholder="Type a message"
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (!disabled && shouldSubmit(e)) {
                  onKeyDown(e)
                }
              }}
              minRows={1}
              maxRows={8}
              data-testid="input"
            />
            <Button type="submit" disabled={disabled} data-testid="send">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

export default ChatInput
