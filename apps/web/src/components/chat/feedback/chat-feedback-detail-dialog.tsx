import React from 'react'
import NiceModal, { useModal } from '@ebay/nice-modal-react'
import { Clock } from 'lucide-react'

import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'

interface IProps {
  latency?: number
  total_tokens?: number
  raw?: string
}

export default NiceModal.create(({ latency, raw, total_tokens }: IProps) => {
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

  return (
    <Dialog open={modal.visible} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="font-medium">API request detail:</DialogHeader>
        <div className="flex items-center space-x-2">
          {latency && (
            <>
              <Clock size={18} />
              <div className="font-medium">
                {(latency / 1000).toPrecision(3)}s
              </div>
            </>
          )}
          {latency && total_tokens && <div className="px-2 font-medium">|</div>}
          {total_tokens !== undefined && (
            <div className="text-slate-500">{total_tokens} tokens</div>
          )}
        </div>
        {raw && (
          <div className="rounded-lg bg-slate-100 p-2">
            <pre className="max-h-96 overflow-y-scroll whitespace-pre-wrap break-all">
              {raw}
            </pre>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
})
