import { cn } from '@/lib/utils'

import { Button } from '../ui/button'
import { useChatContext } from './chat-context'

interface IconBoxProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export const IconBox = (props: IconBoxProps) => (
  <Button
    variant="outline"
    className={`flex h-8 w-8 items-center justify-center rounded-md border p-0 ${props?.className}`}
    onClick={props?.onClick}
  >
    {props?.children}
  </Button>
)

interface IProps {
  onRestart?: () => void
  disabledRestart?: boolean
}

const ChatHeader = ({ onRestart, disabledRestart }: IProps) => {
  const { session, mode } = useChatContext()

  const { name } = session
  return (
    <div
      className={cn(
        'w-full flex-col border-slate-200 max-md:hidden sm:hidden lg:flex',
        mode === 'debug' ? 'border-0' : 'border-b'
      )}
    >
      {mode === 'debug' ? (
        <div className="flex w-full items-center justify-between text-lg font-medium">
          Debug
          <Button
            variant="outline"
            onClick={onRestart}
            disabled={disabledRestart}
          >
            Restart
          </Button>
        </div>
      ) : (
        <div className="flex w-full items-center justify-between px-6 py-3">
          <h2 className="font-medium">{name}</h2>
          <div className="flex"></div>
        </div>
      )}
    </div>
  )
}

export default ChatHeader
