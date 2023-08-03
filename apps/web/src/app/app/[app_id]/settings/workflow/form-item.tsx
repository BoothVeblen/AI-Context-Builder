import { HTMLInputTypeAttribute, ReactNode, useState } from 'react'
import { Check, ChevronsUpDown, PlusIcon, TrashIcon } from 'lucide-react'
import { FieldValues, Path, PathValue, useFormContext } from 'react-hook-form'

import { cn } from '@/lib/utils'
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
import { PdfImage } from '@/components/upload/component'

const labelFilterBuilder =
  (options: { label: string; value: string }[]) =>
  (value: string, search: string): number => {
    const label = options.find((d) => d.value === value)?.label
    if (label?.toLowerCase().includes(search.toLowerCase())) return 1
    return 0
  }

interface IInputItem<T> {
  name: Path<T>
  type?: HTMLInputTypeAttribute | undefined
  label?: string
  placeholder?: string
}

export function InputItem<T extends FieldValues>({
  name,
  type,
  label,
  placeholder,
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
            <Input placeholder={placeholder} type={type} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

interface ITextareaItem<T> {
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
  options: { label: string; value: PathValue<T, Path<T>> }[]
}

export function SelectItem<T extends FieldValues>({
  name,
  label,
  options,
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
                      {item.label}
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
                  const value = +e.target.value
                  const val =
                    value > (max || 1) ? max : value < (min || 0) ? min : value
                  field.onChange(val as any)
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
  options: { label: string; value: PathValue<T, Path<T>>; icon?: string }[]
}

export function ListSelectItem<T extends FieldValues>({
  name,
  label,
  options,
}: IListSelectItem<T>) {
  const form = useFormContext<T>()

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <Popover>
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
                        }}
                        data-disabled={
                          field.value?.includes(item.value) || undefined
                        }
                      >
                        {item.icon === 'pdf' && (
                          <PdfImage className="mr-3 shrink-0" />
                        )}
                        <div className="truncate">{item.label}</div>
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
                  <div className="flex items-center truncate">
                    {icon === 'pdf' && <PdfImage className="mr-3 shrink-0" />}
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
