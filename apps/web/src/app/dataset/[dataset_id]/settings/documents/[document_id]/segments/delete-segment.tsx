import { useModal } from '@ebay/nice-modal-react'
import { Trash } from 'lucide-react'
import useSWRMutation from 'swr/mutation'

import { Button } from '@/components/ui/button'
import ConfirmDialog from '@/components/nice-confirm-dialog'

import { editSegment } from './segment-form-dialog'
import { ISegmentDeleteProps } from './type'

const DeleteSegment = ({
  dataset_id = '',
  uid = '',
  segment_id = '',
  handelRefresh,
}: ISegmentDeleteProps) => {
  const { trigger } = useSWRMutation(`/api/datasets/segment`, editSegment)
  const modal = useModal(ConfirmDialog)

  const onOk = async () => {
    await trigger({ dataset_id, uid, segment_id, content: '' })
    handelRefresh()
  }

  const handleDelete = () => {
    modal.show({
      title: `Delete Segment?`,
      description: ` Are you sure you want to delete this segment? This action cannot be
      undone.`,
      confirmText: 'Delete',
      loadingText: 'Deleting...',
      onOk,
    })
  }

  return (
    <Button
      type="button"
      className="invisible absolute bottom-4 right-4 flex h-8 w-8 gap-2 text-red-600 group-hover/card:visible"
      size="icon"
      variant="outline"
      onClick={(e) => {
        e.stopPropagation()
        handleDelete()
      }}
    >
      <Trash size={18} />
    </Button>
  )
}
export default DeleteSegment
