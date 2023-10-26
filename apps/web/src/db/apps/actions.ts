import 'server-only'

import { redirect } from 'next/navigation'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { difference, isEmpty, pick } from 'lodash'

import { api } from '@/lib/api'
import { auth, currentUser } from '@/lib/auth'
import { db } from '@/lib/drizzle-edge'
import { flags } from '@/lib/flags'
import { logsnag } from '@/lib/logsnag'
import { nanoid, safeParse } from '@/lib/utils'
import { TreeItem } from '@/components/dnd/types'
import {
  DEFAULT_WORKFLOW_DATA,
  DEFAULT_WORKFLOW_TREE,
} from '@/app/(app)/app/[app_id]/(manage)/settings/workflow/const'
import { WorkflowItem } from '@/app/(app)/app/[app_id]/(manage)/settings/workflow/type'
import {
  formatTreeWithData,
  taskToApiFormatter,
} from '@/app/(app)/app/[app_id]/(manage)/settings/workflow/utils'

import { AppsDatasetsTable } from '../apps_datasets/schema'
import { DatasetsTable } from '../datasets/schema'
import { addMessage } from '../messages/actions'
import { formatEventMessage } from '../messages/utils'
import { SessionsTable } from '../sessions/schema'
import { addToWorkspace } from '../workspace/actions'
import { AppsTable, NewApp } from './schema'

export async function addApp(app: Omit<NewApp, 'short_id' | 'created_by'>) {
  const requestId = nanoid()

  try {
    const { userId } = auth()
    if (!userId) {
      throw new Error('Not authenticated')
    }

    const { email } = await currentUser()

    await logsnag?.track({
      user_id: userId,
      channel: 'creator',
      event: 'Create App Request',
      icon: '➡️',
      description: `${email} try to create an app ${app.name}`,
      tags: {
        'request-id': requestId,
        'user-id': userId,
        'has-icon': !!app.icon,
      },
    })

    let api_model_id = ''
    if (flags.enabledAIService) {
      await logsnag?.track({
        user_id: userId,
        channel: 'creator',
        event: 'Create App Request to API service',
        icon: '➡️',
        description: `${email} try to create an app ${app.name} to API service`,
        tags: {
          'request-id': requestId,
          'user-id': userId,
        },
      })

      const chains = DEFAULT_WORKFLOW_DATA.map(taskToApiFormatter)
      const data = await api.post<{ chains: any[] }, { id: string }>(
        '/v1/models',
        { chains }
      )
      api_model_id = data?.id
    }

    const appVal = {
      ...app,
      short_id: nanoid(),
      workflow_tree_str: JSON.stringify(DEFAULT_WORKFLOW_TREE),
      workflow_data_str: JSON.stringify(DEFAULT_WORKFLOW_DATA),
      published_workflow_tree_str: JSON.stringify(DEFAULT_WORKFLOW_TREE),
      published_workflow_data_str: JSON.stringify(DEFAULT_WORKFLOW_DATA),
      api_model_id,
      created_by: userId,
    }
    const [newApp] = await db.insert(AppsTable).values(appVal).returning()

    const appId = newApp?.short_id

    await logsnag?.track({
      user_id: userId,
      channel: 'creator',
      event: 'Create App Request',
      icon: '✅',
      description: `${email} created an app ${app.name} successfully`,
      tags: {
        'request-id': requestId,
        'user-id': userId,
        'app-id': appId,
        'api-model-id': api_model_id,
      },
    })

    await logsnag?.track({
      user_id: userId,
      channel: 'creator',
      event: 'Create Session Request',
      icon: '➡️',
      description: `${email} try to create a session of app ${app.name}`,
      tags: {
        'request-id': requestId,
        'user-id': userId,
        'app-id': appId,
        'api-model-id': api_model_id,
      },
    })

    let api_session_id = ''
    if (flags.enabledAIService) {
      await logsnag?.track({
        user_id: userId,
        channel: 'creator',
        event: 'Create Session Request to API service',
        icon: '➡️',
        description: `${email} try to create a session of app ${app.name} to API service`,
        tags: {
          'request-id': requestId,
          'user-id': userId,
          'app-id': appId,
          'api-model-id': api_model_id,
        },
      })

      const data = await api.post<{ model_id: string }, { session_id: string }>(
        '/v1/chat/session',
        { model_id: api_model_id }
      )
      api_session_id = data?.session_id
    }

    const sessionVal = {
      short_id: nanoid(),
      name: 'Chat 1',
      app_id: appId,
      created_by: userId,
      api_session_id,
    }
    const [newSession] = await db
      .insert(SessionsTable)
      .values(sessionVal)
      .returning()

    if (newApp.opening_remarks) {
      const message = formatEventMessage({
        session_id: newSession.short_id,
        event_type: 'basic.opening_remarks',
        content: newApp.opening_remarks,
      })
      await addMessage(message)
    }

    await logsnag?.track({
      user_id: userId,
      channel: 'creator',
      event: 'Create Session Request',
      icon: '✅',
      description: `${email} created a session of app ${app.name} successfully`,
      tags: {
        'request-id': requestId,
        'user-id': userId,
        'app-id': appId,
        'api-model-id': api_model_id,
        'session-id': newSession?.short_id,
        'api-session-id': api_session_id,
      },
    })

    await addToWorkspace(appId)

    return { appId, sessionId: newSession?.short_id }
  } catch (error: any) {
    const { userId } = auth()
    if (userId) {
      const { email } = await currentUser()
      await logsnag?.track({
        user_id: userId,
        channel: 'creator',
        event: 'Create App Request',
        icon: '❌',
        description: `${email} try to create app/session but failed: ${error.message}`,
        tags: {
          'request-id': requestId,
          'user-id': userId,
          error: error.message,
          'is-error': true,
        },
      })
    }

    return {
      error: error.message,
    }
  }
}

export async function getApps() {
  try {
    const { userId } = auth()
    if (!userId) {
      throw new Error('Not authenticated')
    }

    return db
      .select()
      .from(AppsTable)
      .orderBy(desc(AppsTable.created_at))
      .where(
        and(eq(AppsTable.created_by, userId), eq(AppsTable.archived, false))
      )
  } catch (error) {
    redirect('/')
  }
}

export async function getApp(appId: string) {
  try {
    const [item] = await db
      .select()
      .from(AppsTable)
      .where(eq(AppsTable.short_id, appId))
      .limit(1)

    if (!item) {
      throw new Error('App not found')
    }

    return item
  } catch (error) {
    redirect('/')
  }
}

export async function editApp(appId: string, newValue: Partial<NewApp>) {
  const requestId = nanoid()

  try {
    const { userId } = auth()
    if (!userId) {
      return {
        error: 'Not authenticated',
      }
    }

    const { email, isAdmin } = await currentUser()

    if (flags.enabledAIService) {
      const { api_model_id } = await getApp(appId)
      if (!api_model_id) {
        throw new Error('api_model_id is not found')
      }

      if (flags.enabledVideoInteraction) {
        const payload = pick(newValue, [
          'opening_remarks',
          'enable_video_interaction',
        ])
        if (!isEmpty(payload)) {
          await api.patch(`/v1/models/${api_model_id}`, payload)
        }
      }
    }

    const [updatedApp] = await db
      .update(AppsTable)
      .set(newValue)
      .where(
        isAdmin
          ? eq(AppsTable.short_id, appId)
          : and(eq(AppsTable.short_id, appId), eq(AppsTable.created_by, userId))
      )
      .returning()

    await logsnag?.track({
      user_id: userId,
      channel: 'creator',
      event: 'Edit App Request',
      icon: '✅',
      description: `${email} edit app ${updatedApp.name} successfully`,
      tags: {
        'request-id': requestId,
        'user-id': userId,
        'app-id': appId,
      },
    })

    return updatedApp
  } catch (error: any) {
    const { userId } = auth()
    if (userId) {
      const { email } = await currentUser()
      await logsnag?.track({
        user_id: userId,
        channel: 'creator',
        event: 'Edit App Request',
        icon: '❌',
        description: `${email} try to edit app but failed: ${error.message}`,
        tags: {
          'request-id': requestId,
          'user-id': userId,
          'app-id': appId,
          'updated-value': JSON.stringify(newValue),
          error: error.message,
          'is-error': true,
        },
      })
    }

    return {
      error: error.message,
    }
  }
}

export async function deployApp(appId: string, newValue: Partial<NewApp>) {
  const requestId = nanoid()

  try {
    const { userId } = auth()
    if (!userId) {
      throw new Error('Not authenticated')
    }

    const { email, isAdmin } = await currentUser()

    if (flags.enabledAIService) {
      const { api_model_id } = await getApp(appId)
      if (!api_model_id) {
        throw new Error('api_model_id is not found, please create a new app')
      }

      const tree = safeParse(
        newValue.published_workflow_tree_str,
        []
      ) as TreeItem[]
      const data = safeParse(
        newValue.published_workflow_data_str,
        []
      ) as WorkflowItem[]
      const workflow = formatTreeWithData(tree, data)
      const chains = workflow.map(taskToApiFormatter)
      await api.patch(`/v1/models/${api_model_id}`, { chains })
    }

    // BEGIN link datasets to this app
    const newWorkflow = safeParse(newValue.published_workflow_data_str, [])
    const allApiDatasetIds = newWorkflow.reduce(
      (acc: string[], task: WorkflowItem) => {
        const d =
          (safeParse(task.formValueStr, {}).data?.datasets as string[]) || []
        acc.push(...d)
        return acc
      },
      []
    ) as string[]
    const newApiDatasetIds = [...new Set(allApiDatasetIds)]

    const oldApiDatasetIds = (
      await db
        .select({ api_dataset_id: DatasetsTable.api_dataset_id })
        .from(AppsDatasetsTable)
        .where(eq(AppsDatasetsTable.app_id, appId))
        .leftJoin(
          DatasetsTable,
          eq(DatasetsTable.short_id, AppsDatasetsTable.dataset_id)
        )
    ).map((d) => d.api_dataset_id)

    const addedApiDatasetIds = difference(
      newApiDatasetIds,
      oldApiDatasetIds
    ) as string[]
    const removedApiDatasetIds = difference(
      oldApiDatasetIds,
      newApiDatasetIds
    ) as string[]

    const queue = []
    if (addedApiDatasetIds.length > 0) {
      const addedDatasetIds = (
        await db
          .select({ id: DatasetsTable.short_id })
          .from(DatasetsTable)
          .where(inArray(DatasetsTable.api_dataset_id, addedApiDatasetIds))
      ).map((d) => d.id)
      for (const datasetId of addedDatasetIds) {
        const task = db.insert(AppsDatasetsTable).values({
          app_id: appId,
          dataset_id: datasetId,
        })
        queue.push(task)
      }
    }
    if (removedApiDatasetIds.length > 0) {
      const removedDatasetIds = (
        await db
          .select({ id: DatasetsTable.short_id })
          .from(DatasetsTable)
          .where(inArray(DatasetsTable.api_dataset_id, removedApiDatasetIds))
      ).map((d) => d.id)
      for (const datasetId of removedDatasetIds) {
        const task = db
          .delete(AppsDatasetsTable)
          .where(
            and(
              eq(AppsDatasetsTable.app_id, appId),
              eq(AppsDatasetsTable.dataset_id, datasetId)
            )
          )
        queue.push(task)
      }
    }
    if (queue.length > 0) {
      await Promise.all(queue)
    }
    // END link datasets to this app

    const [updatedApp] = await db
      .update(AppsTable)
      .set(newValue)
      .where(
        isAdmin
          ? eq(AppsTable.short_id, appId)
          : and(eq(AppsTable.short_id, appId), eq(AppsTable.created_by, userId))
      )
      .returning()

    await logsnag?.track({
      user_id: userId,
      channel: 'creator',
      event: 'Publish App Request',
      icon: '✅',
      description: `${email} published app ${updatedApp.name} successfully`,
      tags: {
        'request-id': requestId,
        'user-id': userId,
        'app-id': appId,
        'has-icon': !!updatedApp.icon,
      },
    })

    return updatedApp
  } catch (error: any) {
    const { userId } = auth()
    if (userId) {
      const { email } = await currentUser()
      await logsnag?.track({
        user_id: userId,
        channel: 'creator',
        event: 'Publish App Request',
        icon: '❌',
        description: `${email} try to publish app but failed: ${error.message}`,
        tags: {
          'request-id': requestId,
          'user-id': userId,
          'app-id': appId,
          'updated-value': JSON.stringify(newValue),
          error: error.message,
          'is-error': true,
        },
      })
    }

    return {
      error: error.message,
    }
  }
}

export async function removeApp(appId: string) {
  const requestId = nanoid()

  try {
    const { userId } = auth()
    if (!userId) {
      throw new Error('Not authenticated')
    }

    const { email, isAdmin } = await currentUser()

    const [updatedApp] = await db
      .update(AppsTable)
      .set({ archived: true, updated_at: new Date() })
      .where(
        isAdmin
          ? eq(AppsTable.short_id, appId)
          : and(eq(AppsTable.short_id, appId), eq(AppsTable.created_by, userId))
      )
      .returning()

    await logsnag?.track({
      user_id: userId,
      channel: 'creator',
      event: 'Delete App Request',
      icon: '✅',
      description: `${email} deleted app ${updatedApp.name} successfully`,
      tags: {
        'request-id': requestId,
        'user-id': userId,
        'app-id': appId,
      },
    })

    return updatedApp
  } catch (error: any) {
    const { userId } = auth()
    if (userId) {
      const { email } = await currentUser()
      await logsnag?.track({
        user_id: userId,
        channel: 'creator',
        event: 'Delete App Request',
        icon: '❌',
        description: `${email} try to delete app but failed: ${error.message}`,
        tags: {
          'request-id': requestId,
          'user-id': userId,
          'app-id': appId,
          error: error.message,
          'is-error': true,
        },
      })
    }

    return {
      error: error.message,
    }
  }
}

export async function getAppsBasedOnIds(ids: string[]) {
  try {
    const apps = await db
      .select()
      .from(AppsTable)
      .where(
        and(inArray(AppsTable.short_id, ids), eq(AppsTable.archived, false))
      )
    const sortedApps = ids
      .map((id) => apps.find((app) => app.short_id === id))
      .filter((app) => !!app) as typeof apps
    return sortedApps
  } catch (error) {
    redirect('/')
  }
}

export async function addDebugSession(api_model_id: string) {
  const requestId = nanoid()

  try {
    const { userId } = auth()
    if (!userId || !flags.enabledAIService) return null

    const { email } = await currentUser()

    const data = await api.post<{ model_id: string }, { session_id: string }>(
      '/v1/chat/session',
      { model_id: api_model_id }
    )

    await logsnag?.track({
      user_id: userId,
      channel: 'creator',
      event: 'Debug App Request',
      icon: '✅',
      description: `${email} start to debug app`,
      tags: {
        'request-id': requestId,
        'user-id': userId,
        'api-model-id': api_model_id,
      },
    })

    return data?.session_id
  } catch (error: any) {
    const { userId } = auth()
    if (userId) {
      const { email } = await currentUser()
      await logsnag?.track({
        user_id: userId,
        channel: 'creator',
        event: 'Debug App Request',
        icon: '❌',
        description: `${email} try to debug app but failed: ${error.message}`,
        tags: {
          'request-id': requestId,
          'user-id': userId,
          'api-model-id': api_model_id,
          error: error.message,
          'is-error': true,
        },
      })
    }

    throw new Error(error.message)
  }
}

export async function getDebugSessionId({
  tree,
  data,
}: {
  tree: TreeItem[]
  data: WorkflowItem[]
}) {
  const { userId } = auth()
  if (!userId || !flags.enabledAIService) return null

  const workflow = formatTreeWithData(tree, data)
  const chains = workflow.map(taskToApiFormatter)

  const response = await api.post<{ chains: any[] }, { id: string }>(
    '/v1/models',
    { chains }
  )
  const api_model_id = response?.id
  return await addDebugSession(api_model_id)
}
