'use client'

import { MutableRefObject, ReactNode, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2Icon, RefreshCw, Settings2, Trash } from 'lucide-react'
import useSWRMutation from 'swr/mutation'

import { fetcher } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useToast } from '@/components/ui/use-toast'

const TooltipButton = ({
  children,
  text,
}: {
  children: ReactNode
  text: string
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>
        <p>{text}</p>
      </TooltipContent>
    </Tooltip>
  )
}

interface IProps {
  status: 0 | 1 | 2
  type?: string
  datasetId: string
  currentUid: MutableRefObject<{ uid: string }>
  shortId: string
  setOpen: (s: boolean) => void
}

function synchrony(
  url: string,
  { arg }: { arg: { isSynchrony: boolean; dataset_id: string } }
) {
  return fetcher(url, {
    method: 'PATCH',
    body: JSON.stringify(arg),
  })
}

const TableAction = ({
  datasetId,
  currentUid,
  shortId,
  setOpen,
  status,
  type,
}: IProps) => {
  const [isPending, startTransition] = useTransition()

  const { trigger, isMutating } = useSWRMutation(
    `/api/datasets/document`,
    synchrony
  )

  const router = useRouter()
  const editData = useCallback(
    async (uid: string) => {
      startTransition(() => {
        router.push(`/dataset/${datasetId}/document/${uid}`)
      })
      router.refresh()
    },
    [datasetId, router]
  )

  const { toast } = useToast()

  const refreshData = useCallback(async () => {
    toast({
      description: 'Synchronizing',
    })
    await trigger({ isSynchrony: true, dataset_id: datasetId })
    toast({
      description: 'Synchronized',
    })
    router.refresh()
  }, [datasetId, shortId])

  return (
    <div className="invisible z-10 flex gap-2 group-hover/cell:visible">
      {status === 0 && (
        <TooltipButton text="Edit">
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            onClick={(e) => {
              currentUid.current.uid = shortId
              e.stopPropagation()
              editData(shortId)
            }}
          >
            {isPending && currentUid?.current?.uid === shortId ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <Settings2 size={18} />
            )}
          </Button>
        </TooltipButton>
      )}
      {status === 0 && type === 'annotated_data' && (
        <TooltipButton text="Synchronize">
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            onClick={(e) => {
              currentUid.current.uid = shortId
              e.stopPropagation()
              refreshData()
            }}
          >
            {isMutating && currentUid?.current?.uid === shortId ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw size={18} />
            )}
          </Button>
        </TooltipButton>
      )}
      <TooltipButton text="Delete">
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8 text-red-600"
          onClick={(e) => {
            e.stopPropagation()
            setOpen(true)
            currentUid.current.uid = shortId
          }}
        >
          <Trash size={18} />
        </Button>
      </TooltipButton>
    </div>
  )
}

export default TableAction
