'use client'

import { Suspense, useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { debounce } from 'lodash'
import useSWR from 'swr'

import { fetcher } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

import SegmentHeader from './header'
import { DataTablePagination } from './pagination'
import SegmentList from './segment-list'

interface IProps {
  datasetId: string
  name?: string
  type?: string
  icon?: string
  appId?: string
}

const LoadingCards = () => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 ">
    {Array.from({ length: 6 }).map((_, i) => (
      <Skeleton
        key={i}
        className="h-[182px] rounded-lg border border-transparent"
      />
    ))}
  </div>
)

const SegmentPage = ({ datasetId, name, type, icon, appId }: IProps) => {
  const [value, setValue] = useState('')
  const [fresh, setFresh] = useState(0)

  const [pagination, setPagination] = useState({
    pageSize: 100,
    pageIndex: 0,
  })

  async function getDatasetDocument(
    params: [queries: Record<string, any>, pagination: Record<string, any>]
  ) {
    const [queries, pagination] = params
    const search = new URLSearchParams({
      ...queries,
      ...pagination,
    }).toString()

    return fetcher(`/api/datasets/segment?${search}`, { method: 'GET' })
  }
  const searchParams = useSearchParams()
  const uid = searchParams?.get('uid') || ''
  const queries = { dataset_id: datasetId, uid, search: value }
  const { data, isLoading } = useSWR<any>(
    [queries, pagination, fresh],
    getDatasetDocument,
    {
      keepPreviousData: true,
    }
  )

  const table = useReactTable({
    data: data?.segments,
    columns: [],
    getCoreRowModel: getCoreRowModel(),
    state: { pagination },
    onPaginationChange: setPagination,
    manualPagination: true,
    pageCount: Math.ceil(data?.totalItems || 1),
  })
  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e?.target?.value)
  }, [])

  const throttledOnChange = useMemo(() => debounce(onChange, 500), [onChange])
  return (
    <div className="h-full w-full overflow-auto py-[68px]">
      <Suspense fallback={<Skeleton className="h-32 w-full" />}>
        <SegmentHeader
          datasetId={datasetId}
          uid={uid}
          name={name}
          icon={icon}
          type={type}
          appId={appId}
          handelRefresh={() => setFresh((v) => v + 1)}
        />
      </Suspense>
      <Suspense fallback={<LoadingCards />}>
        <div className="pl-14 pr-8">
          <div className="mb-8 mt-6 flex">
            <Input
              className="w-[240px]"
              placeholder="Search"
              onChange={throttledOnChange}
            />
          </div>
          <div className="flex-1 flex-col">
            {isLoading ? (
              <LoadingCards />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 ">
                <SegmentList
                  segments={data?.segments}
                  datasetId={datasetId}
                  uid={uid}
                  handelRefresh={() => setFresh((v) => v + 1)}
                />
              </div>
            )}
          </div>
          {!value && (
            <div className="mt-8">
              <DataTablePagination table={table} />
            </div>
          )}
        </div>
      </Suspense>
    </div>
  )
}

export default SegmentPage
