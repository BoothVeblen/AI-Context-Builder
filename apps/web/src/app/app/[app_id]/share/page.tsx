'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'

import useCopyToClipboard from '@/hooks/useCopyToClipboard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Text from '@/components/ui/text'

import { FacingIcon, InsIcon, NotionIcon, VersionIcon, WebIcon } from './icons'

const ShareApp = () => {
  const { app_id } = useParams()
  const [copyBtnText, setCopyBtnText] = useState('Copy')
  const { copy } = useCopyToClipboard()

  const protocol = document.location.protocol
  const host = window.location.host
  const link = `${protocol}//${host}/app/${app_id}`

  const handleClick = async () => {
    const hasCopied = await copy(link)
    if (hasCopied) {
      setCopyBtnText('Copied!')
    }
    setTimeout(() => {
      setCopyBtnText('Copy')
    }, 2000)
  }
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-10 px-6 py-3">
        <Text variant="body1">Share App</Text>
        <Text className="text-slate-500">
          Your conversation will not be shared with others.
        </Text>
      </div>
      <div className="m-full h-px bg-slate-100" />
      <div className="pl-[155px] pt-[100px]">
        {/* <div className="mb-6 gap-2">
          <Text>embed this App in</Text>
          <div className="mt-2 flex w-full gap-4">
            <Button variant="outline" className="h-12 w-12 rounded-full p-0">
              <WebIcon />
            </Button>
            <Button variant="outline" className="h-12 w-12 rounded-full p-0">
              <VersionIcon />
            </Button>
            <Button variant="outline" className="h-12 w-12 rounded-full p-0">
              <NotionIcon />
            </Button>
            <Button variant="outline" className="h-12 w-12 rounded-full p-0">
              <FacingIcon />
            </Button>
            <Button variant="outline" className="h-12 w-12 rounded-full p-0">
              <InsIcon />
            </Button>
          </div>
        </div> */}
        <div className="gap-2">
          <Text>Copy link</Text>
          <div className="mt-2 flex gap-1">
            <Input className="w-[324px]" value={link} disabled />
            <Button onClick={handleClick}>{copyBtnText}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ShareApp
