'use client'

import NiceModal from '@ebay/nice-modal-react'

interface IProps {
  children: React.ReactNode
}

export default function ClientProvider({ children }: IProps) {
  return <NiceModal.Provider>{children}</NiceModal.Provider>
}
