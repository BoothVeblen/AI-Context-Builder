import * as React from 'react'
import { CheckIcon, CopyIcon } from 'lucide-react'

import ChatAction, { actionCommonButtonProps } from '../chat-action'

const RESET_COPY_STATE_TIMEOUT = 3000

interface IProps {
  content: string
}

export default function ChatActionCopy({ content }: IProps) {
  const [copied, setCopied] = React.useState(false)

  const Icon = copied ? CheckIcon : CopyIcon

  function handleClick(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.stopPropagation()
    setCopied(true)
    navigator.clipboard.writeText(content)
    setTimeout(() => setCopied(false), RESET_COPY_STATE_TIMEOUT)
  }

  return (
    <ChatAction onClick={handleClick}>
      <Icon {...actionCommonButtonProps} className="text-slate-400" />
    </ChatAction>
  )
}
