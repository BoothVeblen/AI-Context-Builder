import AuthButton from '@/components/auth-button'

import FeaturedList from './featured-list'

const FEATURED_LIST_DATA = [
  {
    id: 'all',
    title: 'All Categories',
  },
  {
    id: 'hr',
    title: 'Human Resources',
  },
  {
    id: 'tr',
    title: 'Translation',
  },
  {
    id: 'kb',
    title: 'Knowledge Base',
  },
  {
    id: 'st',
    title: 'Self Training',
  },
]

export default async function ExploreSidebar() {
  return (
    <>
      <h1 className="px-4 py-2 text-lg font-semibold">Explore</h1>
      <div className="m-full h-px bg-slate-100" />
      <div className="flex-1 overflow-y-auto px-1 py-3">
        <FeaturedList defaultValue={FEATURED_LIST_DATA} />
      </div>
      <AuthButton />
    </>
  )
}
