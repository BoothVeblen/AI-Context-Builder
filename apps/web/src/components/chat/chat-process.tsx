import * as React from 'react'
import { Loader2Icon, Wrench } from 'lucide-react'
import useSWR from 'swr'

import { cn, fetcher } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { SUB_TYPE_MAP } from '@/app/(app)/app/[app_id]/(manage)/settings/workflow/const'

import { ProcessTask, ProcessTaskFromAPI } from './types'
import { useChat } from './useChat'

interface IProps {
  workflow: ProcessTask[]
}

const ChatProcess = ({ workflow }: IProps) => {
  const { session } = useChat()
  const { api_session_id } = session

  const { data, isValidating } = useSWR<ProcessTaskFromAPI[]>(
    `/api/chat/process?api_session_id=${api_session_id}`,
    fetcher,
    {
      revalidateOnMount: true,
    }
  )

  const workflowWithStatus = React.useMemo(() => {
    return workflow.map((item) => {
      if (item.type === 'self_checking_chain') {
        const found = data?.find((d: any) => d.key === item?.key)
        if (found) {
          // TODO: let backend return status enum
          let status = found?.succeed ? 'succeed' : 'failed'
          if (found?.finished === false) status = 'pending'
          return {
            ...item,
            status,
          }
        } else {
          return {
            ...item,
            status: 'pending',
          }
        }
      }
      return item
    })
  }, [workflow, data])

  return (
    <div>
      <div className="flex items-center p-6 text-base font-medium uppercase text-slate-500">
        <div>Process</div>
        {isValidating ? (
          <Loader2Icon className="ml-2 h-4 w-4 animate-spin" />
        ) : null}
      </div>
      <div className="flex flex-col gap-2 pl-4 pr-1">
        {workflowWithStatus?.map((item) => (
          <div key={item?.key} className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-1">
                  <div
                    className={cn(
                      'h-2 w-2 rounded-full',
                      item?.status === 'none' && 'bg-slate-900',
                      item?.status === 'pending' && 'bg-slate-400',
                      item?.status === 'succeed' && 'bg-green-500',
                      item?.status === 'failed' && 'bg-red-500'
                    )}
                  />
                </div>
              </TooltipTrigger>
              {['succeed', 'failed'].includes(item?.status) && (
                <TooltipContent side="left">
                  {item?.status === 'succeed' ? 'Succeed' : 'Failed'}
                </TooltipContent>
              )}
            </Tooltip>

            <div
              className={cn(
                'flex items-center gap-2 truncate rounded-sm border border-slate-100 p-2 text-base text-slate-900',
                item?.status === 'pending' && 'text-slate-400'
              )}
            >
              <Wrench className="shrink-0" />
              <p className="truncate">
                {SUB_TYPE_MAP[item?.type as keyof typeof SUB_TYPE_MAP].title}
              </p>
              <Badge
                variant="secondary"
                className={cn(
                  'shrink-0 text-slate-900',
                  item?.status === 'pending' && 'text-slate-400'
                )}
              >
                {item?.key}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ChatProcess
