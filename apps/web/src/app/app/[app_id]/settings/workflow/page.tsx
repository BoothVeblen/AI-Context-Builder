import AddTaskButton from './add-task-button'
import FormActions from './form-actions'
import FormProvider from './form-provider'
import TaskDetail from './task-detail'
import TaskList from './task-list'

export default function Page() {
  return (
    <FormProvider>
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

        <div className="w-[380px] shrink-0 overflow-auto border-l border-slate-200">
          <TaskDetail />
        </div>
      </div>
      <FormActions />
    </FormProvider>
  )
}
