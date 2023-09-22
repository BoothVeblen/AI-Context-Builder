import { ReactNode } from 'react'
import NiceModal from '@ebay/nice-modal-react'

import { TooltipProvider } from '@/components/ui/tooltip'

export const commonTestWrapper = (children: ReactNode) => {
  return (
    <TooltipProvider>
      <NiceModal.Provider>{children}</NiceModal.Provider>
    </TooltipProvider>
  )
}
