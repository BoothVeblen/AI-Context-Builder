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
import { Session } from '@/db/sessions/schema'
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
import { ChatContextProvider } from '@/components/chat/chat-context'
import ChatList from '@/components/chat/chat-list'
import GenericFilter, { GenericFilterType } from '@/components/generic-filter'

interface SessionWithUser extends Session {
  email: string
  first_name: string
  last_name: string
  image_url: string
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
        accessorKey: 'id',
        header: 'Conversation ID',
      },
      {
        accessorKey: 'total',
        header: 'Message Count',
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
            label: 'ALL',
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
            label: 'User Feedback',
          },
          {
            value: 'nofeedback',
            label: 'No Feedback',
          },
        ],
      },
      {
        type: 'text',
        key: 'search',
        placeholder: 'Search',
      },
    ],
    []
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

  const [selectedSession, setSelectedSession] =
    useState<SessionWithUser | null>(null)

  const messages = useMemo(
    () => JSON.parse(selectedSession?.messages_str || '[]'),
    [selectedSession]
  )

  const user = useMemo(
    () => ({
      first_name: selectedSession?.first_name || null,
      last_name: selectedSession?.last_name || null,
      image_url: selectedSession?.image_url || null,
    }),
    [selectedSession]
  )

  const handleRowClick = useCallback(
    // fix: change Session to SessionWithUser would make DataTable type error
    (session: Session) => () => {
      setSelectedSession(session as SessionWithUser)
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
        open={!!selectedSession}
        onOpenChange={() => setSelectedSession(null)}
      >
        <SheetContent
          side="right"
          className="overflow-scroll sm:max-w-2xl md:max-w-2xl"
        >
          <SheetHeader className="flex-row items-center justify-between space-y-0">
            <SheetTitle>Conversation ID: {selectedSession?.id}</SheetTitle>
            <SheetClose>
              <XIcon
                className="h-7 w-7"
                onClick={() => setSelectedSession(null)}
              />
            </SheetClose>
          </SheetHeader>
          <ChatContextProvider
            mode="history"
            app={data?.app}
            user={user}
            session={selectedSession!}
          >
            <ChatList messages={messages} />
          </ChatContextProvider>
        </SheetContent>
      </Sheet>
    </div>
  )
}
