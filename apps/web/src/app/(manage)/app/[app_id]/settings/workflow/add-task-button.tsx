'use client'

import * as React from 'react'
import { PlusIcon } from 'lucide-react'

import { labelFilterBuilder } from '@/lib/utils'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import { ADD_TASK_BUTTON_CONFIG, TYPE_MAP } from './const'
import { useWorkflowContext } from './store'
import { WorkflowType } from './type'

export default function AddTaskButton() {
  const [open, setOpen] = React.useState(false)

  const addTask = useWorkflowContext((state) => state.addTask)

  const selectHandler = (type: WorkflowType, subType: string) => () => {
    addTask(type, subType)
    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add task
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-96" align="start">
        {ADD_TASK_BUTTON_CONFIG.map((item) => {
          const Icon = TYPE_MAP[item.type].icon
          const options = item.children?.reduce(
            (acc: { value: string; label: string }[], cur) => {
              const labels: { value: string; label: string }[] = []
              cur.children?.forEach((d) => {
                labels.push({ value: d.subType, label: `${d.title} ${d.desc}` })
              })
              return [...acc, ...labels]
            },
            []
          )
          return (
            <DropdownMenuSub key={item.type}>
              <DropdownMenuSubTrigger>
                <Icon className="mr-3 mt-1 h-6 w-6 shrink-0 self-start" />
                <div className="flex-1">
                  <div className="font-medium">{item.title}</div>
                  <div className="mt-1 text-slate-500">{item.desc}</div>
                </div>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="w-80 p-0">
                  <Command filter={labelFilterBuilder(options)}>
                    <CommandInput placeholder="Search" />
                    <CommandList>
                      <CommandEmpty>No results found.</CommandEmpty>
                      {item.children.map((group) => (
                        <CommandGroup key={group.title} heading={group.title}>
                          {group.children.map((subItem) => (
                            <CommandItem
                              value={subItem.subType}
                              key={subItem.subType}
                              onSelect={selectHandler(
                                item.type,
                                subItem.subType
                              )}
                            >
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex-1 truncate">
                                    <div className="font-medium">
                                      {subItem.title}
                                    </div>
                                    <div className="mt-1 truncate text-slate-500">
                                      {subItem.desc}
                                    </div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                  <p className="max-w-xs">{subItem.desc}</p>
                                </TooltipContent>
                              </Tooltip>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      ))}
                    </CommandList>
                  </Command>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
