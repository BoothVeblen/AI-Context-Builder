'use client'

import BaseSideBar from '../sidebar'

interface IProps {
  appId: string
  appName: string
}

export default function Sidebar({ appId }: IProps) {
  return (
    <BaseSideBar>
      <div className="pl-3 text-sm font-medium uppercase text-slate-500">
        App Analysis
      </div>

      <BaseSideBar.Link
        href={`/app/${appId}/analysis/monitoring`}
        name="Monitoring"
        desc="Monitoring application usage situation."
      />
    </BaseSideBar>
  )
}
