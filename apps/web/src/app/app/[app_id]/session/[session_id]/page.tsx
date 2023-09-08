import { safeParse } from '@/lib/utils'
import { App } from '@/db/apps/schema'
import { getMessages } from '@/db/messages/actions'
import { getSession } from '@/db/sessions/actions'
import Chat from '@/components/chat/page'
import { ProcessTask } from '@/components/chat/types'
import {
  chatMessagesFilter,
  chatMessagesFormatter,
  eventMessagesFilter,
  eventMessagesFormatter,
  messagesBuilder,
} from '@/components/chat/utils'
import { TreeItem } from '@/components/dnd/types'

import { WorkflowItem } from '../../(manage)/settings/workflow/type'
import AddAppToWorkspace from './add-app-to-workspace'
import AppNotFound from './app-not-found'

export const runtime = 'edge'

function getWorkflow(app: App) {
  const tree = safeParse(app.published_workflow_tree_str, []) as TreeItem[]
  const data = safeParse(app.published_workflow_data_str, []) as WorkflowItem[]

  const result = []

  for (const t of tree) {
    const d = data.find((d) => d.id === t.id)
    if (d)
      result.push({
        key: `${d.type}-${d.key}`,
        type: d.subType,
        status: 'none',
      } as ProcessTask)
  }

  return result
}

interface IProps {
  params: { app_id: string; session_id: string }
}

export default async function SessionPage({ params }: IProps) {
  const { app_id, session_id } = params
  const { session, app, user } = await getSession(session_id, app_id)

  const rawMessages = await getMessages(session_id)
  const allMessages = messagesBuilder(rawMessages)
  const chatMessages = allMessages
    .filter(chatMessagesFilter)
    .map(chatMessagesFormatter)
  const eventMessages = allMessages
    .filter(eventMessagesFilter)
    .map(eventMessagesFormatter)

  const workflow = app ? getWorkflow(app) : []

  return (
    <>
      <div className="h-full w-full overflow-hidden">
        <Chat
          mode="live"
          app={app}
          session={session}
          user={user}
          initialMessages={chatMessages}
          initialEvents={eventMessages}
          workflow={workflow}
        />
      </div>
      <AppNotFound archived={app?.archived || false} />
      <AddAppToWorkspace appId={app_id} />
    </>
  )
}
