import { safeParse } from '@/lib/utils'
import { getApp } from '@/db/apps/actions'
import { getDatasets } from '@/db/datasets/actions'

import AddTaskButton from './add-task-button'
import FormActions from './form-actions'
import { WorkflowProvider } from './store'
import TaskDetail from './task-detail'
import TaskList from './task-list'

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

  const defaultWorkflowTree = safeParse(workflow_tree_str, [])
  const defaultWorkflowData = safeParse(workflow_data_str, [])
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
      value: d.short_id,
    }
  })

  return (
    <WorkflowProvider
      workflowTree={defaultWorkflowTree}
      workflowData={defaultWorkflowData}
      publishedWorkflowTree={defaultPublishedWorkflowTree}
      publishedWorkflowData={defaultPublishedWorkflowData}
      selectedTaskId={defaultWorkflowTree[0]?.id ?? null}
      datasetOptions={datasetOptions}
    >
      <div className="flex h-full">
        <div className="flex-1 overflow-auto px-14 pt-16">
          <h1 className="text-2xl font-semibold">Workflow</h1>
          <div className="mt-6">
            <TaskList />
          </div>
          <div className="mt-4">
            <AddTaskButton />
          </div>
        </div>

        <TaskDetail />
      </div>

      <FormActions />
    </WorkflowProvider>
  )
}
