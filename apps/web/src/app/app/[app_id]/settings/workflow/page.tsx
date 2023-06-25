import AddTaskButton from './add-task-button'
import TaskList from './task-list'

export default function WorkflowSettingsPage() {
  return (
    <div className="h-full overflow-auto px-14 pt-16">
      <h1 className="text-2xl font-semibold">Workflow</h1>
      <div className="mt-6">
        <TaskList />
      </div>
      <div className="mt-4">
        <AddTaskButton />
      </div>
    </div>
  )
}
