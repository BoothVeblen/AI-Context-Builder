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
  conversation_chain: {
    title: 'Conversation chain',
  },
  conversational_retrieval_qa_chain: {
    title: 'Conversational Retrieval QA',
  },
}
