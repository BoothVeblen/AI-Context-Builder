'use client'

import { ReactNode, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useModal } from '@ebay/nice-modal-react'
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
import ConfirmDialog from '@/components/nice-confirm-dialog'

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
  shortId: string
  handleRefresh: () => void
}

function synchrony(
  url: string,
  {
    arg,
  }: { arg: { isSynchrony: boolean; dataset_id: string; document_id: string } }
) {
  return fetcher(url, {
    method: 'PATCH',
    body: JSON.stringify(arg),
  })
}

function deleteData(
  url: string,
  { arg }: { arg: { dataset_id: string; uid: string } }
) {
  return fetcher(url, {
    method: 'DELETE',
    body: JSON.stringify(arg),
  })
}

const TableAction = ({
  datasetId,
  shortId,
  handleRefresh,
  status,
  type,
}: IProps) => {
  const [isPending, startTransition] = useTransition()
  const confirmDialog = useModal(ConfirmDialog)

  const currentId = useRef({ shortId: '' })

  const { trigger, isMutating } = useSWRMutation(
    `/api/datasets/document`,
    synchrony
  )

  const { trigger: triggerDelete, isMutating: isMutatingDelete } =
    useSWRMutation(`/api/datasets/document`, deleteData)
  const router = useRouter()

  const onOk = async () => {
    await triggerDelete({ dataset_id: datasetId, uid: shortId || '' })
    handleRefresh()
    router.refresh()
  }

  const handelDelete = () => {
    confirmDialog.show({
      title: `Delete Data?`,
      description: `Are you sure you want to delete this data? This action cannot be
      undone.`,
      confirmText: 'Delete Data',
      loadingText: 'Deleting',
      onOk,
    })
  }

  const handelEdit = () => {
    currentId.current.shortId = shortId
    startTransition(() => {
      router.push(`/dataset/${datasetId}/document/${shortId}`)
    })
  }

  const { toast } = useToast()

  const handelSynchronize = async () => {
    toast({
      description: 'Synchronizing',
    })
    await trigger({
      isSynchrony: true,
      dataset_id: datasetId,
      document_id: shortId,
    })
    handleRefresh()
    toast({
      description: 'Synchronized',
    })
  }
  return (
    <div className="invisible z-10 flex gap-2 group-hover/cell:visible">
      {status === 0 && (
        <TooltipButton text="Edit">
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation()
              handelEdit()
            }}
          >
            {isPending && currentId?.current?.shortId === shortId ? (
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
              e.stopPropagation()
              handelSynchronize()
            }}
          >
            {isMutating && currentId?.current?.shortId === shortId ? (
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
            handelDelete()
          }}
        >
          <Trash size={18} />
        </Button>
      </TooltipButton>
    </div>
  )
}

export default TableAction
