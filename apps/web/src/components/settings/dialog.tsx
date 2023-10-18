import React from 'react'
import NiceModal from '@ebay/nice-modal-react'

import useNiceModal from '@/hooks/use-nice-modal'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import List from '@/components/list'

import Account from './account'
import ChatApps from './chat-apps'

const tabs = [
  { id: 'account', title: 'Account' },
  { id: 'chat-apps', title: 'Chat apps' },
]

const TabComponents = {
  account: Account,
  'chat-apps': ChatApps,
}

type TabType = keyof typeof TabComponents

interface IProps {
  defaultTab?: TabType
}

export default NiceModal.create(({ defaultTab = 'account' }: IProps) => {
  const { modal, onOpenChange } = useNiceModal()
  const [tab, setTab] = React.useState<TabType>(defaultTab)

  const onClickBuilder = (id: string) => () => {
    setTab(id as TabType)
  }

  const Content = TabComponents[tab as keyof typeof TabComponents]

  return (
    <Dialog open={modal.visible} onOpenChange={onOpenChange}>
      <DialogContent className="flex min-h-[640px] max-w-[980px] flex-col p-0">
        <div className="flex h-[200px] flex-1">
          <div className="w-[200px] shrink-0 border-r border-slate-200">
            <h1 className="p-4 text-lg font-semibold">Settings</h1>
            <div className="px-2">
              <List
                value={tabs}
                selectedId={tab}
                onClickBuilder={onClickBuilder}
              />
            </div>
          </div>
          <div className="flex-1">
            <Content />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
})
