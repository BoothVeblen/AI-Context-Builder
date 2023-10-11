'use client'

import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useRouter } from 'next/navigation'
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { debounce } from 'lodash'
import { Loader2Icon } from 'lucide-react'
import { shadesOfPurple } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import useSWR from 'swr'

import { cn, fetcher } from '@/lib/utils'
import { NewDocument } from '@/db/documents/schema'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/ui/table/data-table'
import { DataTablePagination } from '@/components/ui/table/pagination'
import { useToast } from '@/components/ui/use-toast'
import { DataProps } from '@/app/dataset/type'

import { formateDate, formateNumber, formateStatus } from '../../../utils'
import DeleteData from './delete-data'
import FileIcon from './file-icon'
import TableAction from './table-action'

interface IProps {
  preload?: NewDocument[]
  datasetId: string
  total?: number
}

const NodeDataChildren = () => (
  <div className="py-[74px] text-base">
    <div>There is no data yet.</div>You can upload data from different channels,
    such as PDF files, Notion documents, and so on.
  </div>
)

const DatasetTable = ({ preload = [], datasetId, total }: IProps) => {
  const [noteDataNode, setNoDataNode] = useState<ReactNode | null>(
    NodeDataChildren
  )

  const [open, setOpen] = useState(false)
  const currentUid = useRef({ uid: '' })
  const router = useRouter()

  const [value, setValue] = useState('')
  const [pagination, setPagination] = useState({
    pageSize: 10,
    pageIndex: 0,
  })

  async function getDatasetDocument(
    params: [
      queries: Record<string, any>,
      pagination: Record<string, any>,
      datasetId: string,
    ]
  ) {
    const [queries, pagination, datasetId] = params
    const search = new URLSearchParams({
      datasetId,
      ...queries,
      ...pagination,
    }).toString()

    return fetcher(`/api/datasets/document?${search}`, { method: 'GET' })
  }

  const { toast } = useToast()

  const [shouldFresh, setShouldFresh] = useState(false)
  const { data, isValidating, isLoading } = useSWR<any>(
    [{ search: value }, pagination, datasetId],
    getDatasetDocument,
    {
      fallbackData: preload,
      keepPreviousData: true,
      ...(shouldFresh ? { refreshInterval: 2000 } : {}),
    }
  )

  useEffect(() => {
    const res = data?.documents?.filter(
      (item: NewDocument) => item?.status === 1
    )
    if (res?.length > 0) {
      setShouldFresh(true)
    }
  }, [data?.documents])

  const columns: ColumnDef<NewDocument>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Data Name',
        cell: ({ row }) => {
          return (
            <div className="truncate">
              <FileIcon data={row.original} />
            </div>
          )
        },
      },
      {
        accessorKey: 'Characters',
        header: 'Characters',
        cell: ({ row }) => (
          <div className="flex w-[70px] items-center justify-end">
            {formateNumber(row.original?.characters || 0)}
            {isValidating && row.original?.status === 1 && (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin text-black" />
            )}
          </div>
        ),
      },
      {
        accessorKey: 'updated_at',
        header: 'Update Time',
        cell: ({ row }) => (
          <div>{formateDate(row?.original?.updated_at || new Date())}</div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const { status } = row.original
          const { text, color } = formateStatus(status || 0)
          return (
            <div className={cn('flex items-center gap-1 text-left', color)}>
              {text}
              {isValidating && status === 1 && (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin text-black" />
              )}
            </div>
          )
        },
      },
      {
        accessorKey: 'uid',
        header: '',
        cell: ({ row }) => {
          const { type, short_id = '' } = row.original
          const status = row?.original?.status as 0 | 2 | 2
          return (
            <TableAction
              setOpen={setOpen}
              status={status}
              type={type}
              shortId={short_id}
              datasetId={datasetId}
              currentUid={currentUid}
            />
          )
        },
      },
    ],
    [datasetId, isValidating]
  )

  const handleRowClick = useCallback(
    (row: any) => () => {
      if (row?.status === 1) {
        toast({
          description: 'Indexing in progress, please wait..',
        })
        return
      }
      if (row?.status === 2) {
        toast({
          variant: 'destructive',
          description: 'Indexing failed, please re-upload.',
        })
        return
      } else {
        const nextUrl = '/datasets'
        const uid = row?.uid
        const params = `uid=${uid}&nextUrl=${nextUrl}`
        router.push(
          `/dataset/${datasetId}/settings/documents/${row?.short_id}/segments?${params}`
        )
        return
      }
    },
    [datasetId, router, toast]
  )

  useEffect(() => {
    if (value && data?.length === 0) {
      setNoDataNode(null)
    }
  }, [value, data])
  const count = data?.total || total
  const table = useReactTable({
    data: data?.documents || preload,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { pagination },
    onPaginationChange: setPagination,
    manualPagination: true,
    pageCount: Math.ceil(count / pagination.pageSize || 0),
  })
  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e?.target?.value)
  }, [])
  const throttledOnChange = useMemo(() => debounce(onChange, 500), [onChange])
  return (
    <div className="space-y-8">
      <div className="mb-8 flex">
        <Input
          className="w-[240px]"
          placeholder="Search"
          onChange={throttledOnChange}
        />
      </div>
      <DataTable
        table={table}
        isLoading={isLoading}
        colSpan={5}
        noDataChildren={noteDataNode}
        onRowClick={handleRowClick}
      />
      <DataTablePagination table={table} />
      <DeleteData
        datasetId={datasetId}
        uid={currentUid?.current?.uid}
        open={open}
        setOpen={setOpen}
      />
    </div>
  )
}

export default DatasetTable
