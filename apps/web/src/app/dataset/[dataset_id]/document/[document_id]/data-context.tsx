'use client'

import { createContext, PropsWithChildren, useContext } from 'react'

import { DataSchemeProps, DocumentProps } from '@/app/dataset/type'

interface DocumentContextType {
  documentId: string
  notedData?: DocumentProps[]
  datasetId: string
  defaultValues?: DataSchemeProps
  isAdd: boolean
  step: number
  uid?: string
  setStep?: (s: number) => void
}

export const DataContext = createContext<DocumentContextType>({
  documentId: '',
  datasetId: '',
  uid: '',
  isAdd: false,
  step: 1,
})

export const useDataContext = () => useContext(DataContext)

export const DataContextProvider = ({
  children,
  ...props
}: PropsWithChildren<DocumentContextType>) => (
  <DataContext.Provider value={props}>{children}</DataContext.Provider>
)
