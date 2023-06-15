'use client'

import { useEffect } from 'react'
import { useExploreStore } from '@/store/explore'

import List from '@/components/list'

interface IProps {
  defaultValue: { id: string; title: string }[]
}

export default function FeaturedList({ defaultValue }: IProps) {
  const selectedCategoryId = useExploreStore(
    (state) => state.selectedCategoryId
  )
  const setSelectedCategoryId = useExploreStore(
    (state) => state.setSelectedCategoryId
  )
  const resetState = useExploreStore((state) => state.resetState)

  const handleClickBuilder = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    console.log(id)
    id && setSelectedCategoryId(id)
  }

  useEffect(() => {
    return () => {
      resetState()
    }
  }, [resetState])

  return (
    <List
      value={defaultValue}
      selectedId={selectedCategoryId}
      onClickBuilder={handleClickBuilder}
    />
  )
}
