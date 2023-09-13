import * as React from 'react'
import NiceModal, { useModal } from '@ebay/nice-modal-react'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

interface IProps {
  title: string
  description: string
  confirmText: string
  loadingText: string
  onOk?: () => Promise<void>
}

export default NiceModal.create(
  ({ title, description, confirmText, loadingText, onOk }: IProps) => {
    const modal = useModal()
    const [loading, setLoading] = React.useState(false)

    function closeModal() {
      modal.hide()
      setTimeout(() => {
        modal.remove()
      }, 200)
    }

    function onOpenChange(open: boolean) {
      if (!open) {
        closeModal()
      }
    }

    async function handleConfirm() {
      React.startTransition(() => setLoading(true))
      try {
        await onOk?.()
        closeModal()
      } catch (error) {
        // TODO: handle error
      } finally {
        setLoading(false)
      }
    }

    return (
      <AlertDialog open={modal.visible} onOpenChange={onOpenChange}>
        <AlertDialogContent className="max-md:max-w-[calc(100%-32px)]">
          <AlertDialogHeader className="min-w-0">
            <AlertDialogTitle className="break-words">{title}</AlertDialogTitle>
            <AlertDialogDescription className="break-words">
              {description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? loadingText : confirmText}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }
)
