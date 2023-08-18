'use client'

import * as React from 'react'
import { Loader2Icon, Play } from 'lucide-react'
import useSWRMutation from 'swr/mutation'

import { fetcher } from '@/lib/utils'
import { App } from '@/db/apps/schema'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import Chat from '@/components/chat/page'
import { ChatMessage } from '@/components/chat/types'

import { useWorkflowContext } from './store'
import { WorkflowItem } from './type'

function getApiSessionId(url: string, { arg }: { arg: WorkflowItem[] }) {
  return fetcher(url, {
    method: 'POST',
    body: JSON.stringify(arg),
  })
}

interface IProps {
  app: App
}

const ChatDebug = ({ app }: IProps) => {
  const { short_id: appId } = app

  const [open, setOpen] = React.useState(false)
  const [apiSessionId, setApiSessionId] = React.useState(null)
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([])
  const sessionIdRef = React.useRef(`debug-${appId}`)

  const workflowData = useWorkflowContext((state) => state.workflowData)
  const [latestWorkflowData, setLatestWorkflowData] =
    React.useState<WorkflowItem[]>(workflowData)
  const shouldResetApiSessionId = React.useMemo(
    () =>
      !apiSessionId ||
      JSON.stringify(workflowData) !== JSON.stringify(latestWorkflowData),
    [apiSessionId, workflowData, latestWorkflowData]
  )

  const { trigger, isMutating } = useSWRMutation(`/api/debug`, getApiSessionId)
  const handleClick = () => {
    if (shouldResetApiSessionId) {
      trigger(workflowData).then((res) => {
        setApiSessionId(res?.api_session_id)
        setOpen(true)
      })
    } else {
      setOpen(true)
    }
  }

  const onOpenChange = (open: boolean) => {
    setOpen(open)

    if (!open) {
      setLatestWorkflowData(workflowData)
    }
  }

  const session = React.useMemo(
    () => ({
      api_session_id: apiSessionId,
      short_id: sessionIdRef.current,
      name: '',
    }),
    [apiSessionId]
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <Button onClick={handleClick} disabled={isMutating}>
        {isMutating ? (
          <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Play className="mr-2 h-4 w-4" />
        )}
        Enter Debug
      </Button>
      <SheetContent
        className="bottom-6 right-6 top-auto h-4/5 w-11/12 divide-x-0 rounded-lg border-none sm:max-w-xl
md:max-w-xl"
      >
        <Chat
          app={app}
          mode="debug"
          isConfigChanged={shouldResetApiSessionId}
          session={session}
          initialMessages={chatMessages}
          setInitialMessages={setChatMessages}
        />
      </SheetContent>
    </Sheet>
  )
}

export default ChatDebug
