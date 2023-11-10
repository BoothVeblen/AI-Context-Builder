import {
  cn,
  getAvatarBgColor,
  getFirstLetter,
  getPresetUrlOfImage,
} from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

import { DataBaseProps } from '../../../type'

interface IProps {
  data?: DataBaseProps
  isAdd?: boolean
  isDisabled?: boolean
}

const NotedDataCard = ({
  data: item,
  isAdd = false,
  isDisabled = false,
}: IProps) => {
  const color = getAvatarBgColor(item?.app_id || '')
  return (
    <div
      className={cn(
        'flex items-center gap-2 overflow-auto truncate text-sm font-normal text-black',
        !isAdd && 'cursor-pointer'
      )}
    >
      <Avatar
        className={cn(
          'relative h-8 w-8',
          item?.icon ? 'bg-white' : `bg-${color}-600`
        )}
      >
        {item?.icon && (
          <AvatarImage src={getPresetUrlOfImage(item?.icon)} alt="data icon" />
        )}
        <AvatarFallback className="bg-transparent text-white">
          {getFirstLetter(item?.name || '')}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col font-medium">
        {item?.name || ''}
        {isDisabled && (
          <div className="text-xs font-normal">already added to dataset</div>
        )}
      </div>
    </div>
  )
}

export default NotedDataCard
