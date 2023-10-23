'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'

import { flags } from '@/lib/flags'
import usePageTitle from '@/hooks/use-page-title'
import useCopyToClipboard from '@/hooks/useCopyToClipboard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import Text from '@/components/ui/text'
import LogosSlackIcon from '@/components/icons/LogosSlackIcon'

import Slack from './slack'
import { TabsList, TabsTrigger } from './tabs'

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
      <div className="max-w-2xl p-4 lg:pl-[155px] lg:pt-[100px]">
        {flags.enabledSlack && (
          <div className="mb-6 gap-2">
            <Text variant="body1">
              Use and share your customized AI apps in:
            </Text>
            <Tabs defaultValue="slack" className="mt-4">
              <TabsList className="mb-8">
                <TabsTrigger value="slack">
                  <LogosSlackIcon className="mr-4 h-6 w-6" />
                  Slack
                </TabsTrigger>
              </TabsList>
              <TabsContent value="slack">
                <Slack context_app_id={app_id} />
              </TabsContent>
            </Tabs>
          </div>
        )}
        <div className="mt-16 gap-2">
          {flags.enabledSlack ? (
            <Text>Or copy link</Text>
          ) : (
            <Text>Copy link</Text>
          )}
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
