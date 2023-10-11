import { Table } from '@tanstack/react-table'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface DataTablePaginationProps<TData> {
  table: Table<TData>
}

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  const total = table.getPageCount()
  const totalItems = new Array(total).fill('').map((val, i) => i + 1)
  return (
    <div className="flex items-center justify-end px-2">
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          {totalItems?.map((item) => {
            const current = table.getState().pagination.pageIndex + 1
            return (
              <div
                key={item}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full',
                  item === current && 'bg-black text-white',
                  item !== current && 'cursor-pointer'
                )}
                onClick={() => table.setPageIndex(item - 1)}
              >
                {item}
              </div>
            )
          })}

          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
