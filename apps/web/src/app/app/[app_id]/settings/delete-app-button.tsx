import * as React from 'react'
import { useRouter } from 'next/navigation'
import { TrashIcon } from 'lucide-react'
import { useSWRConfig } from 'swr'
import useSWRMutation from 'swr/mutation'

import { fetcher } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import ConfirmDialog from '@/components/confirm-dialog'

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
  const { trigger, isMutating } = useSWRMutation(`/api/apps/${id}`, removeApp)

  const [open, setOpen] = React.useState(false)
  const chatStore = useChatStore()

  async function handleConfirm() {
    try {
      await trigger()
      mutate('/api/me/workspace')
      router.push('/apps')
      router.refresh()
      chatStore.removeSession(id)
    } catch (error) {}
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="flex w-full items-center justify-between p-3 hover:bg-slate-200"
        onClick={() => setOpen(true)}
      >
        <span>Delete this App</span>
        <TrashIcon className="mr-2 h-4 w-4" />
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Delete “${name}” App?`}
        description={`Are you sure you want to delete “${name}” App? This action cannot be undone. `}
        confirmText="Delete App"
        loadingText="Deleting..."
        handleConfirm={handleConfirm}
        isLoading={isMutating}
      />
    </>
  )
}
