import { useRouter } from 'next/navigation'
import useSWRMutation from 'swr/mutation'

import { fetcher } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

function deleteData(
  url: string,
  { arg }: { arg: { dataset_id: string; uid: string } }
) {
  return fetcher(url, {
    method: 'DELETE',
    body: JSON.stringify(arg),
  })
}

interface IProps {
  datasetId: string
  uid: string
  open: boolean
  setOpen: (s: boolean) => void
  confirmDelete: () => void
}

const DeleteData = ({
  datasetId,
  uid,
  open,
  setOpen,
  confirmDelete,
}: IProps) => {
  const { trigger, isMutating } = useSWRMutation(
    `/api/datasets/document`,
    deleteData
  )
  const router = useRouter()

  const handelDelete = () => {
    trigger({ dataset_id: datasetId, uid }).then((res) => {
      setOpen(false)
      confirmDelete()
      router.refresh()
    })
  }

  return (
    <div>
      <AlertDialog onOpenChange={setOpen} open={open}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Data?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this data? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => setOpen?.(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handelDelete}
              variant="destructive"
              type="button"
              disabled={isMutating}
            >
              {isMutating ? 'Deleting' : 'Delete Data'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default DeleteData
