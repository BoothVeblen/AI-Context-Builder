import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useModal } from '@ebay/nice-modal-react'
import { TrashIcon } from 'lucide-react'
import { useSWRConfig } from 'swr'
import useSWRMutation from 'swr/mutation'

import { fetcher } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import ConfirmDialog from '@/components/nice-confirm-dialog'

import { useChatStore } from './chat-debug/store'

function removeApp(url: string) {
  return fetcher(url, { method: 'DELETE' })
}

interface IProps {
  id: string
  name: string
}

export default function DeleteAppButton({ id, name }: IProps) {
  const router = useRouter()
  const { mutate } = useSWRConfig()
  const { trigger } = useSWRMutation(`/api/apps/${id}`, removeApp)

  const confirmDialog = useModal(ConfirmDialog)
  const chatStore = useChatStore()

  async function onOk() {
    await trigger()
    mutate('/api/me/workspace')
    router.push('/apps')
    router.refresh()
    chatStore.removeSession(id)
  }

  function handleDelete() {
    confirmDialog.show({
      title: `Delete “${name}” App??`,
      description: `Are you sure you want to delete “${name}” App? This action cannot be undone. `,
      confirmText: 'Delete App',
      loadingText: 'Deleting...',
      onOk,
    })
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="flex w-full items-center justify-between p-3 hover:bg-slate-200"
      onClick={handleDelete}
    >
      <span>Delete this App</span>
      <TrashIcon className="mr-2 h-4 w-4" />
    </Button>
  )
}
