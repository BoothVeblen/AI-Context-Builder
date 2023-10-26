'use client'

import { useSearchParams } from 'next/navigation'

import BaseSideBar from '../sidebar'
import DeleteAppButton from './delete-app-button'

interface IProps {
  appId: string
  appName: string
}

export default function Sidebar({ appId, appName }: IProps) {
  const searchParams = useSearchParams()
  return (
    <BaseSideBar>
      <div className="pl-3 text-sm font-medium uppercase text-slate-500">
        App Settings
      </div>

      <BaseSideBar.Link
        href={{
          pathname: `/app/${appId}/settings/basics`,
          search: searchParams?.toString(),
        }}
        name="Basics"
        desc="Some basic configurations of the App."
      />
      <BaseSideBar.Link
        href={{
          pathname: `/app/${appId}/settings/workflow`,
          search: searchParams?.toString(),
        }}
        name="Workflow"
        desc="Workflow related configurations of the App."
      />

      <div className="mb-2 shrink-0 px-3">
        <div className="h-px bg-slate-200" />
      </div>

      <DeleteAppButton id={appId} name={appName} />
    </BaseSideBar>
  )
}
