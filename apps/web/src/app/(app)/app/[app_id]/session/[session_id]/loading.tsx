import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="flex h-full w-full flex-col space-y-2 p-2">
      <Skeleton className="h-10 w-full" />
      <div className="w-full flex-1 space-y-12 overflow-hidden p-4">
        <div className="flex items-start space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="w-full space-y-4">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-64 w-3/4" />
          </div>
        </div>
        <div className="flex items-start space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="w-full space-y-4">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-64 w-3/4" />
          </div>
        </div>
        <div className="flex items-start space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="w-full space-y-4">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-64 w-3/4" />
          </div>
        </div>
        <div className="flex items-start space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="w-full space-y-4">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-64 w-3/4" />
          </div>
        </div>
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  )
}
