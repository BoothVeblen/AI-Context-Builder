import * as React from 'react'
import { useRouter } from 'next/navigation'
import { TrashIcon } from 'lucide-react'
import { useSWRConfig } from 'swr'
import useSWRMutation from 'swr/mutation'

import { fetcher } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import ConfirmDialog from '@/components/confirm-dialog'

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

  async function handleConfirm() {
    try {
      const json = await trigger()
      console.log('remove app json:', json)
      mutate('/api/me/workspace')
      router.push('/apps')
    } catch (error) {
      console.log('AppSettingDialog handleRemove error:', error)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="lg"
        className="w-full"
        onClick={() => setOpen(true)}
      >
        <TrashIcon className="mr-2 h-4 w-4" /> Delete this App
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
