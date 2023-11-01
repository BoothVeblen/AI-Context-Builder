import { HTMLInputTypeAttribute, ReactNode, useState } from 'react'
import {
  AlertCircleIcon,
  Check,
  ChevronsUpDown,
  Database,
  Loader2Icon,
  PlusIcon,
  TrashIcon,
} from 'lucide-react'
import { FieldValues, Path, PathValue, useFormContext } from 'react-hook-form'
import { SuggestionDataItem } from 'react-mentions'

import { clamp, cn, labelFilterBuilder } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { MentionTextarea } from '@/components/mention-textarea'

import { HAS_K, HAS_MAX_TOKEN_LIMIT, MEMORY_TYPE } from './const'
import { IFormSchema } from './task-item-conversational-retrieval-qa'

interface IInputItem<T> {
  name: Path<T>
  type?: HTMLInputTypeAttribute | undefined
  label?: string | ReactNode
  placeholder?: string
  min?: number
  max?: number
}

export function InputItem<T extends FieldValues>({
  name,
  type,
  label,
  placeholder,
  min,
  max,
}: IInputItem<T>) {
  const form = useFormContext()

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <Input
              placeholder={placeholder}
              type={type}
              {...field}
              value={field.value}
              onChange={(e) => {
                if (type === 'number') {
                  const val = clamp(+e.target.value, min, max)
                  field.onChange(val)
                } else {
                  field.onChange(e)
                }
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export interface ITextareaItem<T> {
  name: Path<T>
  label?: string | ReactNode
  placeholder?: string
}

export function TextareaItem<T extends FieldValues>({
  name,
  label,
  placeholder,
}: ITextareaItem<T>) {
  const form = useFormContext<T>()

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <Textarea placeholder={placeholder} minRows={3} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

interface ISelectItem<T> {
  name: Path<T>
  label?: string
  options: { label: string; value: PathValue<T, Path<T>>; desc?: string }[]
  showTooltip?: boolean
}

export function SelectItem<T extends FieldValues>({
  name,
  label,
  options,
  showTooltip = false,
}: ISelectItem<T>) {
  const form = useFormContext<T>()
  const [open, setOpen] = useState(false)
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          {label && <FormLabel>{label}</FormLabel>}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn(
                    'w-full justify-between',
                    !field.value && 'text-muted-foreground'
                  )}
                >
                  {field.value
                    ? options.find((item) => item.value === field.value)?.label
                    : `Select ${label}`}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[331px] p-0">
              <Command>
                <CommandInput
                  placeholder={`Search ${label?.toLowerCase()}...`}
                />
                <CommandEmpty>No {label?.toLowerCase()} found.</CommandEmpty>
                <CommandGroup>
                  {options.map((item) => (
                    <CommandItem
                      value={item.value}
                      key={item.value}
                      onSelect={(value) => {
                        form.setValue(name, value as PathValue<T, Path<T>>)
                        setOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          item.value === field.value
                            ? 'opacity-100'
                            : 'opacity-0'
                        )}
                      />
                      {showTooltip ? (
                        <Tooltip key={item?.value}>
                          <TooltipTrigger asChild>
                            <div className="flex-1 truncate">{item?.label}</div>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p className="max-w-xs">{item?.desc}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        item?.label
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

interface ISlideItem<T> {
  name: Path<T>
  label?: string
  min?: number
  max?: number
  step?: number
}

export function SlideItem<T extends FieldValues>({
  name,
  label,
  min,
  max,
  step,
}: ISlideItem<T>) {
  const form = useFormContext<T>()

  return (
    <div className="flex space-x-5">
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem className="flex flex-1 flex-col space-y-6">
            {label && <FormLabel>{label}</FormLabel>}
            <Slider
              name={field.name}
              value={[field.value] as number[]}
              min={min}
              max={max}
              step={step}
              onValueChange={(val) => {
                field.onChange(val[0] as any)
              }}
            />
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem className="shrink-0 self-end">
            <FormControl>
              <Input
                type="number"
                placeholder="placeholder"
                min={min}
                max={max}
                step={step}
                {...field}
                value={field.value}
                onChange={(e) => {
                  const val = clamp(+e.target.value, min, max)
                  field.onChange(val)
                }}
                className="h-10 w-18"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

interface IListSelectItem<T> {
  name: Path<T>
  label: string
  options: {
    label: string
    value: PathValue<T, Path<T>>
    icon?: string
    status?: number
  }[]
}

export function ListSelectItem<T extends FieldValues>({
  name,
  label,
  options,
}: IListSelectItem<T>) {
  const form = useFormContext<T>()
  const [open, setOpen] = useState(false)
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add {label}
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent
              className="relative left-[195px] w-[332px] p-0"
              align="end"
            >
              <Command filter={labelFilterBuilder(options)}>
                <CommandInput
                  placeholder={`Search ${label.toLowerCase()}...`}
                />
                {!options?.length && (
                  <div className="py-6 text-center text-sm">
                    No Dataset found.
                  </div>
                )}
                <CommandList>
                  <CommandEmpty>No {label.toLowerCase()} found.</CommandEmpty>
                  <CommandGroup>
                    {options.map((item) => (
                      <CommandItem
                        key={item.value}
                        value={item.value}
                        onSelect={(value) => {
                          // Note: cmdk currently lowercases values in forms for some reason, so don't use
                          // 'value' directly from the onSelect here
                          // const newValue = [...(field.value || []), value]
                          const newValue = [...(field.value || []), item.value]
                          form.setValue(name, newValue as any)
                          setOpen(false)
                        }}
                        data-disabled={
                          field.value?.includes(item.value) || undefined
                        }
                        className="flex items-center justify-between space-x-2"
                      >
                        <div className="flex items-center justify-between gap-2 truncate">
                          <Database
                            size={24}
                            className="mr-2 shrink-0 text-orange-600"
                          />
                          <div className="truncate">{item.label}</div>
                        </div>
                        {item.status != null && item.status === 1 && (
                          <Loader2Icon className="h-4 w-4 animate-spin" />
                        )}
                        {item.status != null && item.status === 2 && (
                          <AlertCircleIcon className="h-4 w-4 text-red-500" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <FormMessage />
          {field.value &&
            field.value.length > 0 &&
            field.value.map((value: string) => {
              const item = options.find((d) => d.value === value)
              const { label, icon } = item || {}
              return (
                <div
                  key={value}
                  className="flex h-12 items-center justify-between space-x-2 rounded-lg border border-slate-200 pl-3 pr-1"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Database
                      size={24}
                      className="mr-2 shrink-0 text-orange-600"
                    />
                    <div className="truncate text-sm font-normal">{label}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => {
                      const newValue = field.value?.filter(
                        (v: string) => v !== value
                      )
                      form.setValue(name, newValue)
                    }}
                  >
                    <TrashIcon size={16} />
                  </Button>
                </div>
              )
            })}
        </FormItem>
      )}
    />
  )
}

export interface IMentionTextareaItem<T> {
  name: Path<T>
  label?: string | ReactNode
  data: SuggestionDataItem[]
}

export function MentionTextareaItem<T extends FieldValues>({
  name,
  label,
  data,
}: IMentionTextareaItem<T>) {
  const form = useFormContext<T>()

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <MentionTextarea
              value={field.value}
              onChange={field.onChange}
              data={data}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function MemoryFormItem<T extends FieldValues>() {
  const form = useFormContext<T>()
  const memory = form.getValues()?.memory
  const type = memory?.memory_type
  const showLimitToken = HAS_MAX_TOKEN_LIMIT?.includes(type)
  const showK = HAS_K?.includes(type)

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-slate-500">MEMORY</div>
      <div className="space-y-8">
        <SelectItem<IFormSchema>
          name="memory.memory_type"
          label="Memory Type"
          options={MEMORY_TYPE}
          showTooltip
        />
        {showK && (
          <InputItem<IFormSchema> name="memory.k" type="number" label="k" />
        )}
        {showLimitToken && (
          <InputItem<IFormSchema>
            name="memory.max_token_limit"
            type="number"
            label="Max Token Limit"
          />
        )}
      </div>
    </div>
  )
}
