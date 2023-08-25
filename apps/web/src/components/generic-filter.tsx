import { useMemo } from 'react'
import { SelectProps } from '@radix-ui/react-select'
import { throttle } from 'lodash'

import { Input, InputProps } from './ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

type FilterType = 'text' | 'select'

type BaseFilter = {
  type: FilterType
  key: string
}

interface TextFilter extends BaseFilter, InputProps {
  type: 'text'
}

interface SelectFilter extends SelectProps, BaseFilter {
  type: 'select'
  options: Array<{ label: string; value: string }>
}

type Props = {
  content: GenericFilterType[]
  onChange: (key: string, value: any) => void
  value: Record<string, any>
}

export type GenericFilterType = TextFilter | SelectFilter

export default function GenericFilter(props: Props) {
  const { content, onChange, value } = props
  const throttledOnChange = useMemo(() => throttle(onChange, 500), [onChange])
  const filters = content.map((item) => {
    const { type, key, ...rest } = item
    switch (item.type) {
      case 'text': {
        return (
          <div className="w-60" key={key}>
            <Input
              {...rest}
              onChange={(e) => {
                throttledOnChange(key, e.target.value)
              }}
            />
          </div>
        )
      }
      case 'select': {
        return (
          <div className="w-48" key={key}>
            <Select
              onValueChange={(v) => {
                onChange(key, v)
              }}
              value={value[key]}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {item.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      }
    }
  })
  return <div className="mb-8 flex space-x-4">{filters}</div>
}
