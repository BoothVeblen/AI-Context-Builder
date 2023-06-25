'use client'

import { useLayoutEffect, useRef, useState } from 'react'

export function useScrollToBottom() {
  // for auto-scroll
  const scrollRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const scrollToBottom = () => {
    const dom = scrollRef.current
    if (dom) {
      setTimeout(() => (dom.scrollTop = dom.scrollHeight), 1)
    }
  }

  // auto scroll
  useLayoutEffect(() => {
    autoScroll && scrollToBottom()
  })

  return {
    scrollRef,
    autoScroll,
    setAutoScroll,
    scrollToBottom,
  }
}
