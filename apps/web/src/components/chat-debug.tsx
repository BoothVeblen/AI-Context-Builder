import { Play } from 'lucide-react'

import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

import Chat, { ChatProps } from './chat/page'
import { Button } from './ui/button'

const ChatDebug = (values: ChatProps) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button>
          <Play />
          Enter Debug
        </Button>
      </SheetTrigger>
      <SheetContent className="bottom-6 right-6 top-auto h-4/5 w-11/12 sm:max-w-xl md:max-w-xl">
        <Chat {...values} mode="debug" />
      </SheetContent>
    </Sheet>
  )
}

export default ChatDebug
