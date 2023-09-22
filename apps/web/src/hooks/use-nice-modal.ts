import { useModal } from '@ebay/nice-modal-react'

export default function useNiceModal() {
  const modal = useModal()

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

  return {
    modal,
    closeModal,
    onOpenChange,
  }
}
