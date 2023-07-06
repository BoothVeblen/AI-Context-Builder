import { BoxIcon, GlobeIcon, User2Icon } from 'lucide-react'

import AuthButton from '@/components/auth-button'

import ExploreList from './explore-list'
import MineList from './mine-list'

export default async function HomeSidebar() {
  return (
    <>
      <h1 className="flex h-12 items-center px-4 text-lg font-semibold">
        Context AI
      </h1>
      <div className="m-full h-px bg-slate-100" />
      <div className="flex-1 px-1 py-3">
        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="flex items-center space-x-2 px-3">
              <GlobeIcon size={20} />
              <span>Explore</span>
            </h2>
            <ExploreList />
          </div>
          <div className="space-y-3">
            <h2 className="flex items-center space-x-2 px-3">
              <BoxIcon size={20} />
              <span>Mine</span>
            </h2>
            <MineList />
          </div>
        </div>
      </div>
      <div className="m-full h-px bg-slate-100" />
      <AuthButton />
    </>
  )
}
