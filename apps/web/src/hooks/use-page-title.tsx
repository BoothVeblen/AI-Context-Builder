import * as React from 'react'

import { useSidebarStore } from '@/store/sidebar'

export default function usePageTitle(title: string) {
  const setPageTitle = useSidebarStore((state) => state.setPageTitle)

  React.useEffect(() => {
    setPageTitle(title)

    return () => setPageTitle('')
  }, [title, setPageTitle])
}
