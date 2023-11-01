import { PropsWithChildren } from 'react'

import { cn } from '@/lib/utils'

import { ListTypeProps } from './type'

interface IProps {
  className?: string
  listType?: ListTypeProps
}

const UploadWrapper = ({
  className,
  listType,
  children,
}: IProps & PropsWithChildren) => {
  return (
    <div
      className={cn(
        'flex cursor-pointer flex-col items-start justify-start',
        listType === 'image' ? 'gap-0' : 'gap-2',
        listType === 'files' || listType === 'update-file'
          ? 'h-full w-full'
          : 'h-16 w-16',
        className
      )}
    >
      {children}
    </div>
  )
}
export default UploadWrapper
