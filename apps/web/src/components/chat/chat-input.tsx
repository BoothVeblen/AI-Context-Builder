'use client'

import * as React from 'react'
import { Loader2, RefreshCw, StopCircle } from 'lucide-react'

import { useEnterSubmit } from '@/hooks/use-enter-submit'

import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'

interface InputProps {
  input: string
  setInput: (e: string) => void
  onSubmit: (value: string) => void
  isLoading: boolean
  reload: () => void
  stop: () => void
  showResend?: boolean
}

const ChatInput = ({
  input,
  setInput,
  onSubmit,
  isLoading,
  reload,
  stop,
  showResend,
}: InputProps) => {
  const inputRef = React.useRef<HTMLTextAreaElement>(null)

  const { formRef, onKeyDown } = useEnterSubmit()

  const isDisabled = !input || input.trim() === '' || isLoading

  return (
    <div className="relative flex w-full flex-col gap-4 px-6 pb-4">
      <div className="absolute top-[-60px] flex w-full	items-center justify-center">
        {showResend && !isLoading && (
          <Button className=" bg-white" onClick={reload} variant="outline">
            <RefreshCw size={16} className="mr-2" />
            Regenerate response
          </Button>
        )}
        {isLoading && (
          <Button className=" bg-white" onClick={stop} variant="outline">
            <StopCircle size={16} className="mr-2" />
            Stop generating
          </Button>
        )}
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          if (isDisabled) {
            return
          }
          setInput('')
          await onSubmit(input)
        }}
        ref={formRef}
      >
        <div className="flex justify-between space-x-2">
          <Textarea
            ref={inputRef}
            className="min-h-[40px]"
            placeholder="Type a message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            minRows={1}
            maxRows={8}
          />
          <Button type="submit" disabled={isDisabled}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send
          </Button>
        </div>
      </form>
    </div>
  )
}

export default ChatInput
