'use client'

import * as React from 'react'
import { Message } from 'ai'
import { Loader2Icon, Play } from 'lucide-react'
import useSWRMutation from 'swr/mutation'

import { fetcher } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import Chat from '@/components/chat/page'

import { useWorkflowContext } from './store'
import { WorkflowItem } from './type'

function getApiSessionId(url: string, { arg }: { arg: WorkflowItem[] }) {
  return fetcher(url, {
    method: 'POST',
    body: JSON.stringify(arg),
  })
}

interface IProps {
  appId: string
  appName: string
  appIcon: string
}

const ChatDebug = ({ appId, appName, appIcon }: IProps) => {
  const [open, setOpen] = React.useState(false)
  const [apiSessionId, setApiSessionId] = React.useState()
  const [chatMessages, setChatMessages] = React.useState<Message[]>([])
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
          appName={appName}
          appIcon={appIcon}
          isDebug
          apiSessionId={apiSessionId}
          appId={appId}
          sessionId={sessionIdRef.current}
          sessionName=""
          initialMessages={chatMessages}
          setInitialMessages={setChatMessages}
          isConfigChanged={shouldResetApiSessionId}
        />
      </SheetContent>
    </Sheet>
  )
}

export default ChatDebug
