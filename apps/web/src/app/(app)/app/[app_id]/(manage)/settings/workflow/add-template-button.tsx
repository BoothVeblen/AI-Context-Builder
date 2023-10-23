'use client'

import { useState } from 'react'
import { CommandGroup } from 'cmdk'
import { Plus } from 'lucide-react'
import { useFormContext } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useFormField } from '@/components/ui/form'

interface IProps {
  config: { title: string; prompt: string }[]
}

const AddTemplateButton = ({ config }: IProps) => {
  const [open, setOpen] = useState(false)
  const { setValue } = useFormContext()
  const { name } = useFormField()

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-blue-800 hover:text-blue-800"
        >
          <Plus size={16} className="mr-2" />
          Add
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="relative right-6 w-[332px]"
        alignOffset={-30}
        side="top"
      >
        <Command>
          <CommandInput placeholder="Search" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {config.map((item) => {
                return (
                  <CommandItem
                    className="p-3"
                    value={item?.prompt}
                    key={item.title}
                    onSelect={() => {
                      setValue(name, item?.prompt)
                      setOpen(false)
                    }}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{item.title}</div>
                      <div className="mt-1 line-clamp-2 text-slate-500">
                        {item.prompt}
                      </div>
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
export default AddTemplateButton
