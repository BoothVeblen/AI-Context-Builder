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
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  handleConfirm: () => void
  isLoading: boolean
  confirmText: string
  loadingText: string
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  handleConfirm,
  isLoading,
  confirmText,
  loadingText,
}: IProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
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
            disabled={isLoading}
          >
            {isLoading ? loadingText : confirmText}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
