import { getMonitoringData } from '@/db/sessions/actions'

import { MonitoringTable } from './table'

interface IProps {
  params: {
    app_id: string
  }
}

export const dynamic = 'force-dynamic'

export default async function Page({ params }: IProps) {
  const { app_id } = params

  const data = await getMonitoringData({
    appId: app_id,
  })

  return (
    <div className="mx-14 mb-9 mt-18">
      <h2 className="mb-6	text-2xl font-semibold leading-8">Monitoring</h2>
      <MonitoringTable preloaded={data} />
    </div>
  )
}
