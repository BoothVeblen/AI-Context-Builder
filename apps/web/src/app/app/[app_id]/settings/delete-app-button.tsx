import * as React from 'react'
import { TrashIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import ConfirmDialog from '@/components/confirm-dialog'

interface IProps {
  id: string
  name: string
}

export default function DeleteAppButton({ id, name }: IProps) {
  const [open, setOpen] = React.useState(false)

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
        handleConfirm={() => {}}
        isLoading={false}
      />
    </>
  )
}
