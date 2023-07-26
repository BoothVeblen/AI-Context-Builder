'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { isEmpty, isEqual } from 'lodash'
import useSWRMutation from 'swr/mutation'

import { fetcher } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

import { useWorkflowContext } from './store'

function editApp(
  url: string,
  {
    arg,
  }: {
    arg: {
      workflow_tree_str?: string
      workflow_data_str?: string
    }
  }
) {
  return fetcher(url, {
    method: 'PATCH',
    body: JSON.stringify(arg),
  })
}

function deployApp(
  url: string,
  {
    arg,
  }: {
    arg: {
      published_workflow_tree_str?: string
      published_workflow_data_str?: string
    }
  }
) {
  return fetcher(url, {
    method: 'PATCH',
    body: JSON.stringify(arg),
  })
}

function useAutoSave(key: string, value: any) {
  const { app_id } = useParams()
  const { trigger } = useSWRMutation(`/api/apps/${app_id}`, editApp)
  const router = useRouter()

  const latestValue = React.useRef(value)

  React.useEffect(() => {
    async function init() {
      if (value !== latestValue.current) {
        console.log('saving data:', key, value)
        await trigger({ [key]: value })
        latestValue.current = value
        router.refresh()
      }
    }

    init()
  }, [trigger, key, value, router])
}

function AutoSave() {
  const workflowTree = useWorkflowContext((state) => state.workflowTree)
  const workflowData = useWorkflowContext((state) => state.workflowData)

  useAutoSave('workflow_tree_str', JSON.stringify(workflowTree))
  useAutoSave('workflow_data_str', JSON.stringify(workflowData))

  return null
}

function ResetSection() {
  const resetWorkflow = useWorkflowContext((state) => state.resetWorkflow)
  const workflowTree = useWorkflowContext((state) => state.workflowTree)
  const workflowData = useWorkflowContext((state) => state.workflowData)
  const publishedWorkflowTree = useWorkflowContext(
    (state) => state.publishedWorkflowTree
  )
  const publishedWorkflowData = useWorkflowContext(
    (state) => state.publishedWorkflowData
  )

  const isDisabled =
    isEqual(workflowTree, publishedWorkflowTree) &&
    isEqual(workflowData, publishedWorkflowData)

  return (
    <div className="flex flex-1 items-center justify-between">
      {isDisabled ? (
        <div />
      ) : (
        <div className="text-slate-900">Your have unpublished changes yet!</div>
      )}
      <Button
        type="button"
        variant="ghost"
        onClick={resetWorkflow}
        disabled={isDisabled}
      >
        Reset
      </Button>
    </div>
  )
}

function PublishButton() {
  const { app_id } = useParams()
  const { trigger, isMutating } = useSWRMutation(
    `/api/apps/${app_id}/deploy`,
    deployApp
  )
  const { toast } = useToast()
  const router = useRouter()

  const workflowTree = useWorkflowContext((state) => state.workflowTree)
  const workflowData = useWorkflowContext((state) => state.workflowData)
  const publishWorkflow = useWorkflowContext((state) => state.publishWorkflow)

  async function handlePublish() {
    try {
      await trigger({
        published_workflow_tree_str: JSON.stringify(workflowTree),
        published_workflow_data_str: JSON.stringify(workflowData),
      })
      publishWorkflow()
      toast({ title: 'Publish success!' })
      router.refresh()
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Publish failed!',
        description: error.message,
      })
    }
  }

  const isDisabled = isEmpty(workflowTree) || isMutating

  return (
    <Button type="button" onClick={handlePublish} disabled={isDisabled}>
      {isMutating ? 'Publishing' : 'Publish'}
    </Button>
  )
}

export default function FormActions() {
  return (
    <>
      <div className="fixed bottom-4 left-[276px] mx-4">
        <div className="flex h-18 w-[600px] max-w-md items-center space-x-2 rounded-lg border border-slate-100 bg-background px-4 shadow-md lg:max-w-lg xl:max-w-xl 2xl:max-w-full">
          <ResetSection />
          <PublishButton />
        </div>
      </div>

      <AutoSave />
    </>
  )
}
