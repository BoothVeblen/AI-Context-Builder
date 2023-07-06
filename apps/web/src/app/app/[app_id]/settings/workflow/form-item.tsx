import { Check, ChevronsUpDown, PlusIcon, TrashIcon } from 'lucide-react'
import { ConditionalKeys } from 'type-fest'

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

import { IFormSchema, useFormContext } from './form-provider'

const labelFilterBuilder =
  (options: { label: string; value: string }[]) =>
  (value: string, search: string): number => {
    const label = options.find((d) => d.value === value)?.label
    if (label?.toLowerCase().includes(search.toLowerCase())) return 1
    return 0
  }

interface IInputItem {
  name: ConditionalKeys<IFormSchema, string | undefined>
  label?: string
  placeholder?: string
}

export function InputItem({ name, label, placeholder }: IInputItem) {
  const form = useFormContext()

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <Input placeholder={placeholder} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

interface ITextareaItem {
  name: ConditionalKeys<IFormSchema, string | undefined>
  label?: string
  placeholder?: string
}

export function TextareaItem({ name, label, placeholder }: ITextareaItem) {
  const form = useFormContext()

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

interface ISelectItem {
  name: ConditionalKeys<IFormSchema, string | undefined>
  label?: string
  options: { label: string; value: string }[]
}

export function SelectItem({ name, label, options }: ISelectItem) {
  const form = useFormContext()

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          {label && <FormLabel>{label}</FormLabel>}
          <Popover>
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
            <PopoverContent className="w-[316px] p-0">
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
                        form.setValue(name, value)
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

interface ISlideItem {
  name: ConditionalKeys<IFormSchema, number[] | undefined>
  label?: string
  min?: number
  max?: number
  step?: number
}

export function SlideItem({ name, label, min, max, step }: ISlideItem) {
  const form = useFormContext()

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
              value={field.value as number[]}
              min={min}
              max={max}
              step={step}
              onValueChange={field.onChange}
            />
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="model_temperature"
        render={({ field }) => (
          <FormItem className="shrink-0 self-end">
            <FormControl>
              <Input
                type="number"
                placeholder="placeholder"
                min={0}
                max={1}
                step={0.1}
                {...field}
                value={field.value[0]}
                onChange={(e) => {
                  const value = +e.target.value
                  field.onChange([value])
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

interface IListSelectItem {
  name: ConditionalKeys<IFormSchema, string[] | undefined>
  label: string
  options: { label: string; value: string }[]
}

export function ListSelectItem({ name, label, options }: IListSelectItem) {
  const form = useFormContext()

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
                  <PlusIcon className="mr-2 h-4 w-4" /> Add {label}
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="end">
              <Command filter={labelFilterBuilder(options)}>
                <CommandInput
                  placeholder={`Search ${label.toLowerCase()}...`}
                />
                <CommandList>
                  <CommandEmpty>No {label.toLowerCase()} found.</CommandEmpty>
                  <CommandGroup>
                    {options.map((item) => (
                      <CommandItem
                        key={item.value}
                        value={item.value}
                        onSelect={(value) => {
                          const newValue = [...(field.value || []), value]
                          form.setValue(name, newValue)
                        }}
                        data-disabled={
                          field.value?.includes(item.value) || undefined
                        }
                      >
                        {item.label}
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
            field.value.map((value) => {
              const label = options.find((d) => d.value === value)?.label
              return (
                <div
                  key={value}
                  className="flex h-12 items-center justify-between space-x-2 rounded-lg border border-slate-200 pl-3 pr-1"
                >
                  <div className="truncate text-sm font-normal">{label}</div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      const newValue = field.value?.filter((v) => v !== value)
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
