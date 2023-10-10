import { Dispatch, SetStateAction } from 'react'
import { ZapIcon, ZapOffIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import { useChat } from './useChat'

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
  showProcess?: boolean
  setShowProcess?: Dispatch<SetStateAction<boolean>>
}

const ChatHeader = ({
  onRestart,
  disabledRestart,
  showProcess,
  setShowProcess,
}: IProps) => {
  const { session, mode } = useChat()
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
          {mode === 'live' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  onClick={() => setShowProcess?.((s: boolean) => !s)}
                >
                  {!showProcess ? (
                    <ZapIcon size="16" />
                  ) : (
                    <ZapOffIcon size="16" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{showProcess ? 'Hide process' : 'Show process'}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  )
}

export default ChatHeader
