'use client'

import * as React from 'react'
import { Loader2Icon, Play } from 'lucide-react'
import { nanoid } from 'nanoid'
import useSWRMutation from 'swr/mutation'

import { fetcher } from '@/lib/utils'
import { App } from '@/db/apps/schema'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import Chat from '@/components/chat/page'
import { ChatMessage, EventMessage } from '@/components/chat/types'
import { TreeItem } from '@/components/dnd/types'

import { useWorkflowContext } from '../workflow/store'
import { WorkflowItem } from '../workflow/type'
import { useChatStore } from './store'

interface IProps {
  app: App
}

function getApiSessionId(
  url: string,
  { arg }: { arg: { tree: TreeItem[]; data: WorkflowItem[] } }
) {
  return fetcher(url, {
    method: 'POST',
    body: JSON.stringify(arg),
  })
}

const ChatDebug = ({ app }: IProps) => {
  const { short_id: appId, opening_remarks } = app
  const [open, setOpen] = React.useState(false)
  const [apiSessionId, setApiSessionId] = React.useState(null)
  const chatStore = useChatStore()
  const { sessions } = chatStore

  const sessionIdRef = React.useRef(`debug-${appId}`)

  const workflowTree = useWorkflowContext((state) => state.workflowTree)
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
    getMessageHistory()
    if (shouldResetApiSessionId) {
      trigger({ tree: workflowTree, data: workflowData }).then((res) => {
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

  const current = chatStore.currentSession()
  const initialMessages: EventMessage[] = React.useMemo(() => {
    const showRemark = current?.messages?.length === 0
    const update = current?.eventMessages[0]?.content !== opening_remarks
    if (opening_remarks) {
      return update && showRemark
        ? [
            {
              id: nanoid(),
              role: 'assistant',
              createdAt: new Date(),
              content: opening_remarks,
              type: 'event',
              eventType: '',
            },
          ]
        : current?.eventMessages
    } else {
      return []
    }
  }, [current?.eventMessages, current?.messages?.length, opening_remarks])

  const getMessageHistory = React.useCallback(() => {
    chatStore.selectSession(appId)
    const isExisted = sessions?.find((item) => item?.id === appId)
    if (!isExisted?.id) {
      chatStore.newSession(appId, [], initialMessages)
    } else {
      chatStore.onNewMessage(current?.messages)
      chatStore.onNewEventMessage(initialMessages)
    }
  }, [appId, current?.messages, initialMessages])

  const handleMessage = (messages: ChatMessage[]) => {
    chatStore.onNewMessage(messages)
  }

  const onRestart = () => {
    chatStore.onNewMessage([])
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
          app={app}
          mode="debug"
          api="/api/chat/debug"
          isConfigChanged={shouldResetApiSessionId}
          session={session}
          initialMessages={current?.messages}
          initialEvents={current?.eventMessages}
          saveMessages={handleMessage}
          onRestart={onRestart}
        />
      </SheetContent>
    </Sheet>
  )
}

export default ChatDebug
