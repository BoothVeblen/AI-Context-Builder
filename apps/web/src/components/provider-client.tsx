'use client'

import NiceModal from '@ebay/nice-modal-react'

import { TooltipProvider } from './ui/tooltip'

interface IProps {
  children: React.ReactNode
}

export default function ClientProvider({ children }: IProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <NiceModal.Provider>{children}</NiceModal.Provider>
    </TooltipProvider>
  )
}
