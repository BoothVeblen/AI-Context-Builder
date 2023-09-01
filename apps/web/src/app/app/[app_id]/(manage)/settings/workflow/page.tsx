import { safeParse } from '@/lib/utils'
import { getApp } from '@/db/apps/actions'
import { getDatasets } from '@/db/datasets/actions'

import ChatDebug from '../chat-debug/chat-debug'
import AddTaskButton from './add-task-button'
import FormActions from './form-actions'
import { WorkflowProvider } from './store'
import TaskDetail from './task-detail'
import TaskList from './task-list'

export const runtime = 'edge'

interface IProps {
  params: {
    app_id: string
  }
}

export default async function Page({ params }: IProps) {
  const { app_id } = params

  const appDetail = await getApp(app_id)
  const {
    workflow_tree_str,
    workflow_data_str,
    published_workflow_tree_str,
    published_workflow_data_str,
  } = appDetail

  const DEFAULT_WORKFLOW_TREE = safeParse(workflow_tree_str, [])
  const DEFAULT_WORKFLOW_DATA = safeParse(workflow_data_str, [])
  const defaultPublishedWorkflowTree = safeParse(
    published_workflow_tree_str,
    []
  )
  const defaultPublishedWorkflowData = safeParse(
    published_workflow_data_str,
    []
  )

  const datasets = await getDatasets()
  const datasetOptions = datasets.map((d) => {
    return {
      icon: (d.config as any).loaderType || 'pdf',
      label: d.name,
      value: d.api_dataset_id,
      status: d.status,
    }
  })

  return (
    <WorkflowProvider
      workflowTree={DEFAULT_WORKFLOW_TREE}
      workflowData={DEFAULT_WORKFLOW_DATA}
      publishedWorkflowTree={defaultPublishedWorkflowTree}
      publishedWorkflowData={defaultPublishedWorkflowData}
      selectedTaskId={DEFAULT_WORKFLOW_TREE[0]?.id ?? null}
      datasetOptions={datasetOptions}
    >
      <div className="flex h-full">
        <div className="flex-1 overflow-auto px-14 pb-28 pt-16">
          <h1 className="text-2xl font-semibold">Workflow</h1>
          <div className="mt-6">
            <TaskList />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <AddTaskButton />
            <ChatDebug app={appDetail} />
          </div>
        </div>

        <TaskDetail />
      </div>

      <FormActions />
    </WorkflowProvider>
  )
}
