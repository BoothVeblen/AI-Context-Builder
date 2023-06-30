'use client'

import * as React from 'react'
import { useSettingsStore, WorkflowType } from '@/store/settings'
import { LightbulbIcon, PlusIcon } from 'lucide-react'

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

const CONFIG = [
  {
    type: 'model',
    title: 'Models',
    desc: 'Models or integrated models, such as large language model GPT-4.',
    children: [
      {
        title: 'LLMs',
        children: [
          {
            subType: 'gpt-3.5-turbo',
            title: 'gpt-3.5-turbo',
            desc: 'Most capable GPT-3.5 model and optimized for chat at 1/10th the cost of text-davinci-003. Will be updated with our latest model iteration 2 weeks after it is released.',
          },
          {
            subType: 'gpt-4',
            title: 'gpt-4',
            desc: 'More capable than any GPT-3.5 model, able to do more complex tasks, and optimized for chat. Will be updated with our latest model iteration 2 weeks after it is released.',
          },
          {
            subType: 'claude v1',
            title: 'claude v1',
            desc: 'Claude is a next-generation AI assistant based on Anthropic’s research into training helpful, honest, and harmless AI systems.',
          },
        ],
      },
    ],
  },
  {
    type: 'agents',
    title: 'Agents',
    desc: 'Task scheduler, automatically selects the appropriate tool to call.',
    children: [
      {
        title: 'Agent',
        children: [
          {
            subType: 'agent-1',
            title: 'Agent 1 title',
            desc: 'Agent 1 desc',
          },
          {
            subType: 'agent-2',
            title: 'Agent 2 title',
            desc: 'Agent 2 desc',
          },
          {
            subType: 'agent-3',
            title: 'Agent 3 title',
            desc: 'Agent 3 desc',
          },
        ],
      },
    ],
  },
  {
    type: 'tools',
    title: 'Tools',
    desc: 'Some encapsulated tools to handle certain tasks.',
    children: [
      {
        title: 'Tool',
        children: [
          {
            subType: 'tool-1',
            title: 'Tool 1 title',
            desc: 'Tool 1 desc',
          },
          {
            subType: 'tool-2',
            title: 'Tool 2 title',
            desc: 'Tool 2 desc',
          },
          {
            subType: 'tool-3',
            title: 'Tool 3 title',
            desc: 'Tool 3 desc',
          },
        ],
      },
    ],
  },
]

export default function AddTaskButton() {
  const [open, setOpen] = React.useState(false)

  const addWorkflow = useSettingsStore((state) => state.addWorkflow)

  const selectHandler = (type: WorkflowType, subType: string) => () => {
    addWorkflow(type, subType)
    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" /> Add task
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-96" align="start">
        {CONFIG.map((item) => (
          <DropdownMenuSub key={item.type}>
            <DropdownMenuSubTrigger>
              <LightbulbIcon className="mr-3 mt-1 h-6 w-6 shrink-0 self-start" />
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
                            onSelect={selectHandler(item.type, subItem.subType)}
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
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
