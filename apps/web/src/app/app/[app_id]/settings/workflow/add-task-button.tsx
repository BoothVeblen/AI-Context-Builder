'use client'

import * as React from 'react'
import { PlusIcon, WrenchIcon } from 'lucide-react'

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

import { useWorkflowContext } from './store'
import { WorkflowType } from './type'

const ICON_MAP = {
  tool: WrenchIcon,
}

const CONFIG = [
  {
    type: 'tool',
    title: 'Tools',
    desc: 'Some encapsulated tools to handle certain tasks.',
    children: [
      {
        title: 'Chains',
        children: [
          {
            subType: 'conversation_chain',
            title: 'Conversation chain',
            desc: 'Basic example of conversation with a Prompt Template and LLM Model',
          },
          {
            subType: 'conversational_retrieval_qa_chain',
            title: 'Conversational Retrieval QA',
            desc: 'Support uploading data source, from the data source find answers',
          },
        ],
      },
    ],
  },
] satisfies {
  type: 'tool'
  title: string
  desc: string
  children: {
    title: string
    children: {
      subType: string
      title: string
      desc: string
    }[]
  }[]
}[]

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
        {CONFIG.map((item) => {
          const Icon = ICON_MAP[item.type]
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
                  <Command>
                    <CommandInput placeholder="Search" />
                    <CommandList>
                      <CommandEmpty>No results found.</CommandEmpty>
                      {item.children.map((group) => (
                        <CommandGroup key={group.title} heading={group.title}>
                          {group.children.map((subItem) => (
                            <CommandItem
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
