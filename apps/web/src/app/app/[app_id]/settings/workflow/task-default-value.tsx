import { TreeItem } from '@/components/dnd/types'

import { WorkflowItem } from './type'

export const TaskDefaultValueMap = {
  'conversation-chain': {
    llm: {
      model_name: 'openai-gpt-3.5-turbo',
      api_key: '',
      temperature: 0.9,
      max_tokens: 256,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    },
    prompt: {
      type: 'prompt_template',
      template: '',
    },
  },
  'conversational-retrieval-qa': {
    llm: {
      model_name: 'openai-gpt-3.5-turbo',
      api_key: '',
      temperature: 0.9,
      max_tokens: 256,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    },
    prompt: {
      type: 'prompt_template',
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
    id: 'default_conversation_chain_id',
    type: 'tool',
    subType: 'conversation-chain',
    formValueStr:
      '{"llm":{"model_name":"openai-gpt-3.5-turbo","api_key":"","temperature":0.9,"max_tokens":256,"top_p":1,"frequency_penalty":0,"presence_penalty":0},"prompt":{"type":"prompt_template","template":""}}',
  },
]
