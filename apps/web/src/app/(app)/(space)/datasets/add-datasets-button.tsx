'use client'

import { useModal } from '@ebay/nice-modal-react'
import { PlusIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import CreateDatasetDialog from '@/components/create-dataset-dialog'

const AddDatasetButton = () => {
  const modal = useModal(CreateDatasetDialog)

  return (
    <Button size="sm" onClick={() => modal.show()}>
      <PlusIcon className="mr-2 h-4 w-4" />
      Add Dataset
    </Button>
  )
}

export default AddDatasetButton
