'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { debounce } from 'lodash'
import useSWR from 'swr'

import { fetcher } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { SegmentProps } from '@/app/dataset/type'

import AddOrEdit from './add-edit-segment'
import DeleteSegment from './delete-segment'
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

const SegmentPage = ({ datasetId, name, type, icon, appId }: IProps) => {
  const [open, setOpen] = useState(false)
  const [showDeleteAlter, setShowDeleteAlter] = useState(false)
  const [value, setValue] = useState('')
  const [fresh, setFresh] = useState(0)

  const [pagination, setPagination] = useState({
    pageSize: 100,
    pageIndex: 0,
  })
  const current = useRef<SegmentProps>({ content: '', segment_id: '' })

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
      <SegmentHeader
        datasetId={datasetId}
        uid={uid}
        name={name}
        icon={icon}
        type={type}
        appId={appId}
        addNew={() => {
          setOpen(true)
          current.current = { content: '', segment_id: '' }
        }}
      />
      <div className="pl-14 pr-8">
        <div className="mb-8 mt-6 flex">
          <Input
            className="w-[240px]"
            placeholder="Search"
            onChange={throttledOnChange}
          />
        </div>
        <div className="flex-1 flex-col">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 ">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-[182px] rounded-lg border border-transparent"
                />
              ))
            ) : (
              <SegmentList
                segments={data?.segments}
                setOpen={setOpen}
                current={current}
                setShowDeleteAlter={setShowDeleteAlter}
              />
            )}
          </div>
        </div>
        {!value && (
          <div className="mt-8">
            <DataTablePagination table={table} />
          </div>
        )}
      </div>
      <DeleteSegment
        dataset_id={datasetId}
        uid={uid}
        segment_id={current?.current?.segment_id || ''}
        showDeleteAlter={showDeleteAlter}
        setShowDeleteAlter={setShowDeleteAlter}
        handelConfirm={() => setFresh((v) => v + 1)}
      />
      <AddOrEdit
        content={current?.current?.content || ''}
        open={open}
        segment_id={current?.current?.segment_id || ''}
        dataset_id={datasetId}
        document_id={uid}
        setOpen={setOpen}
        handelConfirm={() => setFresh((v) => v + 1)}
      />
    </div>
  )
}

export default SegmentPage
