import LinkList from './link-list'

const DEFAULT_VALUE = [
  {
    href: '/explore',
    title: 'All Categories',
  },
  {
    href: '/explore/retrieval',
    title: 'Q&A of your Data', // 私有数据问答
  },
  {
    href: '/explore/interview',
    title: 'Mock Interview', // 模拟面试
  },
  {
    href: '/explore/form',
    title: 'Intelligent Forms', // 智能表单
  },
  {
    href: '/explore/character',
    title: 'Role Play', // 角色扮演
  },
  {
    href: '/explore/assistant',
    title: 'Useful Assistant', // 有用的助手
  },
  // {
  //   href: '/explore/training',
  //   title: 'Enterprise Training', // 企业培训
  // },
]

export default function ExploreList() {
  return <LinkList value={DEFAULT_VALUE} />
}
