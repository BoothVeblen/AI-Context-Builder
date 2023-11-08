'use client'

import { useModal } from '@ebay/nice-modal-react'
import { PlusIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import CreateAppDialog from '@/components/create-app-dialog'

const AddAppButton = () => {
  const modal = useModal(CreateAppDialog)

  return (
    <Button size="sm" onClick={() => modal.show()}>
      <PlusIcon className="mr-2 h-4 w-4" />
      Create App
    </Button>
  )
}

export default AddAppButton
