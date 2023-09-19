// source: https://github.com/Yidadaa/ChatGPT-Next-Web/blob/175b4e7f92abba782bdd2561c5e479bc315d6d9f/app/components/chat.tsx#L190
import * as React from 'react'

export default function useSubmitHandler() {
  const isComposing = React.useRef(false)

  React.useEffect(() => {
    const onCompositionStart = () => {
      isComposing.current = true
    }
    const onCompositionEnd = () => {
      isComposing.current = false
    }

    window.addEventListener('compositionstart', onCompositionStart)
    window.addEventListener('compositionend', onCompositionEnd)

    return () => {
      window.removeEventListener('compositionstart', onCompositionStart)
      window.removeEventListener('compositionend', onCompositionEnd)
    }
  }, [])

  const shouldSubmit = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter') return false
    if (e.key === 'Enter' && (e.nativeEvent.isComposing || isComposing.current))
      return false
    return !e.altKey && !e.ctrlKey && !e.shiftKey && !e.metaKey
  }

  return {
    shouldSubmit,
  }
}
