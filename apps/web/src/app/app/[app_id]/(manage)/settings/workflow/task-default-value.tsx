import { TreeItem } from '@/components/dnd/types'

import { DEFAULT_MAX_TOKENS } from './const'
import { WorkflowItem } from './type'

export const TaskDefaultValueMap = {
  conversation_chain: {
    llm: {
      name: 'gpt-3.5-turbo',
      api_key: '',
      temperature: 0.9,
      max_tokens: DEFAULT_MAX_TOKENS,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    },
    prompt: {
      template: '',
    },
  },
  conversational_retrieval_qa_chain: {
    llm: {
      name: 'gpt-3.5-turbo',
      api_key: '',
      temperature: 0.9,
      max_tokens: DEFAULT_MAX_TOKENS,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    },
    prompt: {
      template: '',
    },
    retriever: {
      type: 'pinecone_hybrid_search',
    },
    data: {
      datasets: [],
    },
  },
}

export const defaultWorkflowTree: TreeItem[] = [
  { id: 'default_conversation_chain_id', children: [] },
]

export const defaultWorkflowData: WorkflowItem[] = [
  {
    key: 0,
    id: 'default_conversation_chain_id',
    type: 'tool',
    subType: 'conversation_chain',
    formValueStr: `{"llm":{"name":"gpt-3.5-turbo","api_key":"","temperature":0.9,"max_tokens":${DEFAULT_MAX_TOKENS},"top_p":1,"frequency_penalty":0,"presence_penalty":0},"prompt":{"template":""}}`,
  },
]
