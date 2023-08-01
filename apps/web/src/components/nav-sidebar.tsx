import { BoxIcon, GlobeIcon } from 'lucide-react'

import AuthButton from '@/components/auth-button'

import ExploreList from './explore-list'
import MineList from './mine-list'

export default async function NavSidebar() {
  return (
    <div className="flex w-60 shrink-0 grow flex-col bg-gray-50">
      <div className="flex-1 overflow-y-auto scrollbar-none">
        <h1 className="flex h-12 shrink-0 items-center px-4 text-lg font-semibold">
          Context AI
        </h1>
        <div className="m-full h-px shrink-0 bg-slate-200" />
        <div className="flex-1 px-2 py-3">
          <div className="space-y-3">
            <div className="space-y-3">
              <h2 className="flex items-center space-x-2 p-2">
                <GlobeIcon size={20} />
                <span>Explore</span>
              </h2>
              <ExploreList />
            </div>
            <div className="m-full -mx-2 h-px shrink-0 bg-slate-200" />
            <div className="space-y-3">
              <h2 className="flex items-center space-x-2 p-2">
                <BoxIcon size={20} />
                <span>My space</span>
              </h2>
              <MineList />
            </div>
          </div>
        </div>
      </div>
      <AuthButton />
    </div>
  )
}
