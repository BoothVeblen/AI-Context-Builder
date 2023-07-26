import { RocketIcon, WrenchIcon } from 'lucide-react'

export const TYPE_MAP = {
  tool: {
    title: 'Tools',
    icon: WrenchIcon,
  },
  agent: {
    title: 'Agents',
    icon: RocketIcon,
  },
}

export const SUB_TYPE_MAP = {
  'conversation-chain': {
    title: 'Conversation chain',
  },
  'conversational-retrieval-qa': {
    title: 'Conversational Retrieval QA',
  },
}
