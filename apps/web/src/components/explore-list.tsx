import LinkList from './link-list'

const DEFAULT_VALUE = [
  {
    href: '/explore',
    title: 'All Categories',
  },
  // {
  //   href: '/explore/hr',
  //   title: 'Human Resources',
  // },
  // {
  //   href: '/explore/tr',
  //   title: 'Translation',
  // },
  // {
  //   href: '/explore/kb',
  //   title: 'Knowledge Base',
  // },
  // {
  //   href: '/explore/st',
  //   title: 'Self Training',
  // },
]

export default function ExploreList() {
  return <LinkList value={DEFAULT_VALUE} />
}
