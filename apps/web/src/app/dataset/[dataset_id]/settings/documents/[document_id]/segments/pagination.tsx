'use client'

import { useMemo } from 'react'
import { Table } from '@tanstack/react-table'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from 'lucide-react'
import RcPagination from 'rc-pagination'

import { Button } from '@/components/ui/button'

interface DataTablePaginationProps<TData> {
  table: Table<TData>
}

const PAGINATION_LOCAL = {
  en: {
    // Pagination.jsx
    prev_page: 'Previous Page',
    next_page: 'Next Page',
    prev_5: 'Previous 5 Pages',
    next_5: 'Next 5 Pages',
    prev_3: 'Previous 3 Pages',
    next_3: 'Next 3 Pages',
    page_size: 'Page Size',
  },
}

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  const iconsProps = useMemo<Record<PropertyKey, React.ReactNode>>(() => {
    const ellipsis = (
      <span className="group/edit block group-hover/item:hidden">•••</span>
    )
    const prevIcon = (
      <Button
        variant="outline"
        className="h-8 w-8 p-0"
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>
    )
    const nextIcon = (
      <Button
        variant="outline"
        className="h-8 w-8 p-0"
        onClick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
      >
        <ChevronRightIcon className=" h-4 w-4" />
      </Button>
    )
    const jumpPrevIcon = (
      <Button
        variant="ghost"
        className="group/item h-8 w-8 p-0"
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
      >
        {ellipsis}
        <ChevronsLeftIcon className="group/edit hidden h-4 w-4 group-hover/item:block" />
      </Button>
    )
    const jumpNextIcon = (
      <Button
        variant="ghost"
        className="group/item h-8 w-8 p-0"
        onClick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
      >
        {ellipsis}

        <ChevronsRightIcon className="group/edit hidden h-4 w-4 group-hover/item:block" />
      </Button>
    )
    return { prevIcon, nextIcon, jumpPrevIcon, jumpNextIcon }
  }, [table])

  const pageProps = useMemo(() => {
    const current = table.getState().pagination.pageIndex + 1
    const pageSize = table.getState().pagination.pageSize
    const total = table.getPageCount()
    return { current, total, pageSize }
  }, [table.getState().pagination, table.getPageCount()])

  return (
    <div className="flex h-full w-full items-center justify-end px-2">
      <RcPagination
        className="flex items-center space-x-2"
        {...iconsProps}
        {...pageProps}
        locale={PAGINATION_LOCAL.en}
        onChange={(current, _) => {
          table.setPageIndex(current - 1)
        }}
      />
    </div>
  )
}
