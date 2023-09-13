import LinkList from './link-list'

const DEFAULT_VALUE = [
  {
    href: '/explore',
    title: 'All Categories',
  },
  {
    href: '/explore/la',
    title: 'Language Assistant',
  },
  {
    href: '/explore/fc',
    title: 'Famous Character',
  },
  {
    href: '/explore/wr',
    title: 'Writing',
  },
  {
    href: '/explore/ua',
    title: 'Useful Assistant',
  },
  {
    href: '/explore/pr',
    title: 'Professional',
  },
  {
    href: '/explore/sd',
    title: 'Search Document',
  },
  {
    href: '/explore/in',
    title: 'Interviewer',
  },
]

export default function ExploreList() {
  return <LinkList value={DEFAULT_VALUE} />
}
