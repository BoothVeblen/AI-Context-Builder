'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'

import { flags } from '@/lib/flags'
import usePageTitle from '@/hooks/use-page-title'
import useCopyToClipboard from '@/hooks/useCopyToClipboard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Text from '@/components/ui/text'

import Slack from './slack'

export const runtime = 'edge'

const ShareApp = () => {
  const { app_id } = useParams() as {
    app_id: string
  }
  const [copyBtnText, setCopyBtnText] = React.useState('Copy')
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

  usePageTitle('Share App')

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-10 px-6 py-3">
        <Text variant="body1" className="hidden lg:block">
          Share App
        </Text>
        <Text className="text-slate-500">
          Your conversation will not be shared with others.
        </Text>
      </div>
      <div className="m-full h-px bg-slate-100" />
      <div className="p-4 lg:pl-[155px] lg:pt-[100px]">
        {flags.enabledSlack && (
          <div className="mb-6 gap-2">
            <Text>Use this App in</Text>
            <div className="mt-2 flex gap-4">
              <Slack appId={app_id} />
            </div>
          </div>
        )}
        <div className="gap-2">
          <Text>Copy link</Text>
          <div className="mt-2 flex gap-2">
            <Input className="w-[324px]" value={link} disabled />
            <Button onClick={handleClick}>{copyBtnText}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ShareApp
