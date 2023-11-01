import { FileImage } from '@/components/upload/component'
import { DataBaseProps } from '@/app/dataset/type'

import NotedDataCard from '../../document/[document_id]/noted-data-card'

export function Title({ children }: { children: React.ReactNode }) {
  return <div className="text-lg font-semibold">{children}</div>
}

interface ItemProps {
  label: string
  value: string | DataBaseProps
  type?: string
}
export function Item({ label, value, type }: ItemProps) {
  const showText = type !== 'files' && typeof value === 'string'
  if (type === 'files' && Array.isArray(value)) {
    return (
      <div className="space-y-2">
        {value.map(({ name, type: loaderType, uid, icon }: DataBaseProps) => (
          <File key={uid} name={name} type={loaderType} icon={icon} uid={uid} />
        ))}
      </div>
    )
  }
  return (
    <div className="space-y-2">
      <div className="text-base font-medium">{label}</div>
      <div className="text-sm">{showText ? value : '-'}</div>
    </div>
  )
}

export function File({ name, type, icon, uid, short_id }: DataBaseProps) {
  return (
    <div className="flex h-16 max-w-sm items-center space-x-2 rounded-lg border border-slate-200 px-6">
      <div className="shrink-0">
        {type !== 'annotated_data' ? (
          <FileImage type={type} />
        ) : (
          <NotedDataCard
            data={{ name, uid, icon, type, short_id }}
            isAdd={false}
          />
        )}
      </div>
      <div className="truncate text-sm font-medium">{name}</div>
    </div>
  )
}
