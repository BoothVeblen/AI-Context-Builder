'use client'

import { useCallback, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ThumbsDown, ThumbsUp, XIcon } from 'lucide-react'
import useSWR from 'swr'

import { fetcher } from '@/lib/utils'
import { getMonitoringData } from '@/db/sessions/actions'
import { useConfigStore } from '@/store/config'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { DataTable } from '@/components/ui/table/data-table'
import { DataTablePagination } from '@/components/ui/table/pagination'
import ChatListWithData from '@/components/chat/chat-list-with-data'
import GenericFilter, { GenericFilterType } from '@/components/generic-filter'

interface TableSession {
  id: number
  short_id: string
  created_at: Date
  email: string | null
  total: number
  feedback: {
    good: number
    bad: number
  }
}

type Data = Awaited<ReturnType<typeof getMonitoringData>>

type Props = {
  preloaded: Data
}

async function fetchMonitoringData(
  params: [
    app_id: string,
    app_id: Record<string, any>,
    pagination: Record<string, any>,
  ]
) {
  const [app_id, filters, pagination] = params
  const search = new URLSearchParams({
    ...filters,
    ...pagination,
  }).toString()

  return fetcher(`/api/apps/${app_id}/monitoring?${search}`)
}

export const MonitoringTable = ({ preloaded }: Props) => {
  const { app_id } = useParams() as {
    app_id: string
  }
  const { timeframeFilter, changeTimeframeFilter } = useConfigStore()

  const [queries, setQueries] = useState({
    timeframe: timeframeFilter,
    feedback: 'all',
    search: '',
  })
  const [pagination, setPagination] = useState({
    pageSize: 10,
    pageIndex: 0,
  })

  const { data, isValidating } = useSWR<Data>(
    [app_id, queries, pagination],
    fetchMonitoringData,
    {
      fallbackData: preloaded,
      keepPreviousData: true,
    }
  )

  const columns: ColumnDef<Data['sessions'][number]>[] = useMemo(
    () => [
      {
        accessorKey: 'created_at',
        header: 'Time',
        cell: ({ row }) =>
          new Date(row.getValue('created_at')).toLocaleString(),
      },
      {
        accessorKey: 'email',
        header: 'User Email',
      },
      {
        accessorKey: 'short_id',
        header: 'Conversation ID',
      },
      {
        accessorKey: 'total',
        header: () => <div className="text-right">Message Count</div>,
        cell: ({ row }) => {
          return <div className="text-right">{row.getValue('total')}</div>
        },
      },
      {
        accessorKey: 'feedback',
        header: 'User Feedback',
        cell: ({ row }) => {
          const value = row.getValue<{
            good: number
            bad: number
          }>('feedback')

          if (value.good === 0 && value.bad === 0) return '-'

          return (
            <div className="flex space-x-6">
              {value.good > 0 && (
                <div className="flex space-x-2">
                  <ThumbsUp className="stroke-green-500" />
                  <div>{value.good}</div>
                </div>
              )}
              {value.bad > 0 && (
                <div className="flex space-x-2">
                  <ThumbsDown className="stroke-red-500" />
                  <div>{value.bad}</div>
                </div>
              )}
            </div>
          )
        },
      },
    ],
    []
  )

  const filters: GenericFilterType[] = useMemo(
    () => [
      {
        key: 'timeframe',
        type: 'select',
        options: [
          {
            value: 'today',
            label: 'Today',
          },
          {
            value: 'last7days',
            label: 'Last 7 days',
          },
          {
            value: 'last3months',
            label: 'Last 3 months',
          },
          {
            value: 'last12months',
            label: 'Last 12 months',
          },
          {
            value: 'monthtodate',
            label: 'Month to date',
          },
          {
            value: 'quartertodate',
            label: 'Quarter to date',
          },
          {
            value: 'yeartodate',
            label: 'Year to date',
          },
          {
            value: 'all',
            label: 'All',
          },
        ],
      },
      {
        key: 'feedback',
        type: 'select',
        defaultValue: 'all',
        options: [
          {
            value: 'all',
            label: 'All',
          },
          {
            value: 'userfeedback',
            label: `User Feedback (${data?.feedbacks ?? 0} items)`,
          },
          {
            value: 'nofeedback',
            label: 'No Feedback',
          },
          {
            value: 'annotated',
            label: `Annotated Improvements (${data?.annotations ?? 0} items)`,
          },
          {
            value: 'notannotated',
            label: 'Not Annotated',
          },
        ],
      },
      {
        type: 'text',
        key: 'search',
        placeholder: 'Search',
      },
    ],
    [data?.annotations, data?.feedbacks]
  )

  const handleFilterChange = useCallback(
    async (key: string, value: any) => {
      if (key === 'timeframe') {
        changeTimeframeFilter(value)
      }
      setQueries((prev) => ({ ...prev, [key]: value }))
    },
    [changeTimeframeFilter]
  )

  const table = useReactTable({
    data: data!.sessions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { pagination },
    onPaginationChange: setPagination,
    manualPagination: true,
    pageCount: Math.ceil((data?.count || 0) / pagination.pageSize),
  })

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  )

  const handleRowClick = useCallback(
    (session: TableSession) => () => {
      setSelectedSessionId(session.short_id)
    },
    []
  )

  return (
    <div className="space-y-8">
      <GenericFilter
        onChange={handleFilterChange}
        value={queries}
        content={filters}
      />
      <DataTable
        table={table}
        isLoading={isValidating}
        onRowClick={handleRowClick}
      />
      <DataTablePagination table={table} />
      <Sheet
        open={!!selectedSessionId}
        onOpenChange={() => setSelectedSessionId(null)}
      >
        <SheetContent
          side="right"
          className="overflow-scroll p-0 sm:max-w-[720px] md:max-w-[720px]"
        >
          <SheetHeader className="sticky top-0 z-20 flex-row items-center justify-between space-y-0 border-b bg-white px-6 py-4">
            <SheetTitle>Conversation ID: {selectedSessionId}</SheetTitle>
            <SheetClose>
              <XIcon
                className="h-7 w-7"
                onClick={() => setSelectedSessionId(null)}
              />
            </SheetClose>
          </SheetHeader>
          <div className="px-6 pr-8">
            {selectedSessionId && (
              <ChatListWithData mode="history" sessionId={selectedSessionId} />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
