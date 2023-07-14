'use client'

import { useState } from 'react'
import { CheckIcon, ChevronsUpDown } from 'lucide-react'
import { UseFormReturn } from 'react-hook-form'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface OptionsProps {
  value: string
  label: string
}
interface IProps {
  form: UseFormReturn<any>
  values: OptionsProps[]
  name: string
  title?: string
  isRequired?: boolean
}

const SearchSelect = ({
  form,
  values,
  name,
  title,
  isRequired = false,
}: IProps) => {
  const [open, setOpen] = useState<boolean>(false)
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="mb-6 flex flex-col">
          <FormLabel className="flex">
            Type {isRequired && <div className="text-red-500">*</div>}
          </FormLabel>
          <Popover open={open} onOpenChange={(open) => setOpen(open)}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className={cn(
                    'w-[332px] justify-between font-normal',
                    !field.value && 'text-muted-foreground'
                  )}
                >
                  {field.value
                    ? values.find((type) => type.value === field.value)?.label
                    : `Select ${title}`}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[332px] p-0">
              <Command>
                <CommandInput placeholder={`Search ${title}`} className="h-9" />
                <CommandEmpty>{`No ${title} found.`}</CommandEmpty>
                <CommandGroup>
                  {values.map((type) => (
                    <CommandItem
                      value={type.value}
                      key={type.value}
                      onSelect={(value) => {
                        console.log(value, '---value')
                        form.setValue('type', value)
                        setOpen(false)
                      }}
                      data-disabled={type?.value === 'coming soon' || undefined}
                    >
                      {type.label}
                      <CheckIcon
                        className={cn(
                          'ml-auto h-4 w-4',
                          type.value === field.value
                            ? 'opacity-100'
                            : 'opacity-0'
                        )}
                      />
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
export default SearchSelect
