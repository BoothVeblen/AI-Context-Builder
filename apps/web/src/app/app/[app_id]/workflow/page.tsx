import TaskList from './task-list'

interface IProps {
  params: { app_id: string }
}

export default async function Page({ params }: IProps) {
  const { app_id } = params

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 shrink-0 items-center justify-between px-6">
        <h1>Workflow</h1>
      </div>
      <div className="h-px w-full shrink-0 bg-slate-100" />
      <TaskList />
    </div>
  )
}
