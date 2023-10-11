import useSWRMutation from 'swr/mutation'

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

import { editSegment } from './segment-form'
import { ISegmentDeleteProps } from './type'

const DeleteSegment = ({
  dataset_id = '',
  uid = '',
  segment_id = '',
  setShowDeleteAlter,
  showDeleteAlter,
  handelConfirm,
}: ISegmentDeleteProps) => {
  const { trigger, isMutating } = useSWRMutation(
    `/api/datasets/segment`,
    editSegment
  )

  const handelDelete = async () => {
    await trigger({ dataset_id, uid, segment_id, content: '' })
    setShowDeleteAlter?.(false)
    handelConfirm?.()
  }
  return (
    <AlertDialog onOpenChange={setShowDeleteAlter} open={showDeleteAlter}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Segment?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this segment? This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            type="button"
            onClick={() => setShowDeleteAlter?.(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handelDelete}
            variant="destructive"
            type="button"
            disabled={isMutating}
          >
            {isMutating ? 'Deleting' : 'Delete'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
export default DeleteSegment
