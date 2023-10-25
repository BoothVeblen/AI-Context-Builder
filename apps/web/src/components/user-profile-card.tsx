import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface IProps {
  name: string
  email?: string
  imageUrl?: string
  isAdmin?: boolean
}

export default function UserProfileCard({
  name,
  email,
  imageUrl,
  isAdmin,
}: IProps) {
  return (
    <div className="flex items-center space-x-2 truncate">
      {imageUrl && (
        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full">
          <img
            src={imageUrl}
            alt="current user avatar"
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="truncate">
        <div className="flex items-center">
          <p className="truncate text-sm font-medium">{name}</p>
          {isAdmin && (
            <Badge variant="secondary" className="ml-2">
              👨🏻‍💻
            </Badge>
          )}
        </div>
        {email && (
          <p className="truncate text-xs font-medium text-slate-500">{email}</p>
        )}
      </div>
    </div>
  )
}

export function Loading() {
  return (
    <div className="flex items-center space-x-2">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="space-y-1">
        <Skeleton className="h-4 w-[150px]" />
        <Skeleton className="h-4 w-[100px]" />
      </div>
    </div>
  )
}
UserProfileCard.Loading = Loading
