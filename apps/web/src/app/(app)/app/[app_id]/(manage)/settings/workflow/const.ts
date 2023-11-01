import { RocketIcon, WrenchIcon } from 'lucide-react'

import { TreeItem } from '@/components/dnd/types'

import { WorkflowItem } from './type'

export const DEFAULT_MAX_TOKENS = 256
export const MAX_MAX_TOKENS = 4096

const DEFAULT_LLM = {
  name: 'gpt-3.5-turbo',
  api_key: '',
  temperature: 0.7,
  max_tokens: DEFAULT_MAX_TOKENS,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
}

export const DEFAULT_MEMORY = {
  memory_type: 'conversation_buffer_window_memory',
  k: 5,
  max_token_limit: 2000,
}

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
    title: 'Conversation',
  },
  conversational_retrieval_qa_chain: {
    title: 'Conversational Retrieval QA',
  },
  self_checking_chain: {
    title: 'Goal-Oriented Conversation',
  },
}

export const ADD_TASK_BUTTON_CONFIG = [
  {
    type: 'tool',
    title: 'Tools',
    desc: 'Some encapsulated tools to handle certain tasks.',
    children: [
      {
        title: 'Chains',
        children: [
          {
            subType: 'conversation_chain',
            title: 'Conversation',
            desc: 'Basic example of conversation with a Prompt Template and LLM Model',
          },
          {
            subType: 'conversational_retrieval_qa_chain',
            title: 'Conversational Retrieval QA',
            desc: 'Support uploading data sources and searching for answers from data sources',
          },
          {
            subType: 'self_checking_chain',
            title: 'Goal-Oriented Conversation',
            desc: 'Conversation that follows a predetermined format or set of rules to achieve specific goals or objectives. The structure helps keep the conversation focused on the intended outcomes and prevents digressions or irrelevant discussions. This type of dialogue is often used in problem-solving sessions, decision-making processes, and consensus-building efforts.',
          },
        ],
      },
    ],
  },
] satisfies {
  type: 'tool' | 'agent'
  title: string
  desc: string
  children: {
    title: string
    children: {
      subType: string
      title: string
      desc: string
    }[]
  }[]
}[]

export const TASK_DEFAULT_VALUE_MAP = {
  conversation_chain: {
    llm: DEFAULT_LLM,
    prompt: {
      template: '',
    },
    memory: DEFAULT_MEMORY,
  },
  conversational_retrieval_qa_chain: {
    llm: DEFAULT_LLM,
    prompt: {
      template: '',
      basic_prompt: `background: '''[{context}]'''
Use the text separated by three quotation marks in the background to answer the question. Do not add any additional information. Make sure the answer is correct, do not output false content. If the answer cannot be found in the text, please write "The answer is not provided in the document".`,
    },
    memory: DEFAULT_MEMORY,
    retriever: {
      type: 'pinecone_hybrid_search',
    },
    data: {
      datasets: [],
    },
  },
  self_checking_chain: {
    llm: DEFAULT_LLM,
    prompt: {
      template: '',
      target: '',
      check_prompt: `The goal is [{target}].
Please determine if this conversation has achieved its objective. If the objective has been met, simply respond with "yes" and refrain from adding further comments. If the objective hasn't been met, in order to continue pursuing the objective, please raise a follow-up question based on the content of this conversation. Ensure that, in the event the objective hasn't been met, your question is definitely aimed at achieving the objective and doesn't deviate from it."`,
      follow_up_questions_num: 1,
      output_definition: '',
    },
    memory: DEFAULT_MEMORY,
  },
}

export const DEFAULT_WORKFLOW_TREE: TreeItem[] = [
  { id: 'default_conversation_chain_id', children: [] },
]

export const DEFAULT_WORKFLOW_DATA: WorkflowItem[] = [
  {
    key: 0,
    id: 'default_conversation_chain_id',
    type: 'tool',
    subType: 'conversation_chain',
    formValueStr: JSON.stringify(TASK_DEFAULT_VALUE_MAP['conversation_chain']),
  },
]

export const SYSTEM_PROMPT_TEMPLATES = [
  {
    title: 'Roleplay - Interviewer',
    prompt: `I want you to act as an software engineer internship interviewer. I will be the candidate and you will ask me the interview questions for the position position. I want you to only reply as the interviewer. Do not write all the conservation at once. I want you to only do the interview with me. Ask me the questions and wait for my answers. Do not write explanations. Ask me the questions one by one like an interviewer does and wait for my answers.`,
  },
  {
    title: 'Multilingual translation assistant',
    prompt: `You are a helpful assistant that translates English to French.`,
  },
  {
    title: 'Product customer service',
    prompt: `You are a customer service agent, answering customer questions. Only answer what you know.`,
  },
]

export const BASIC_PROMPT_TEMPLATES = [
  {
    title: 'Default Template',
    prompt: `background: '''[{context}]'''
Use the text separated by three quotation marks in the background to answer the question. Do not add any additional information. Make sure the answer is correct, do not output false content. If the answer cannot be found in the text, please write "The answer is not provided in the document".`,
  },
  {
    title: 'Additional Information',
    prompt: `background: '''[{context}]'''
Prioritize using the text separated by three quotation marks in the background to answer the questions. Do not add any additional information. Ensure the answer is correct and do not provide false information."
If the answer cannot be found in the text, you may use other known information to answer, but ensure the answer is correct and do not provide false information.`,
  },
]

export const MEMORY_TYPE = [
  {
    label: 'NoMemory',
    value: 'no_memory',
    desc: 'During the conversation, the history of previous rounds will not be retained. You can choose this option when you want the AI to perform very specific functions or generate very specific responses.',
  },
  {
    label: 'ConversationBufferWindowMemory',
    value: 'conversation_buffer_window_memory',
    desc: 'During the conversation, the history of the previous k rounds will be retained as memory. You can choose this option when you want a more intelligent conversation and the AI to remember the content of the recent few rounds of dialogue.',
  },

  {
    label: 'ConversationTokenBufferMemory',
    value: 'conversation_token_buffer_memory',
    desc: 'During the conversation, the history of the previous X tokens will be retained as memory. You can choose this option when you want a more intelligent conversation, and the AI to remember some of the recent dialogue content.',
  },
  {
    label: 'SummaryMemory',
    value: 'summary_memory',
    desc: 'During the conversation, all the summarized historical dialogues will be retained as memory. You can choose this option when you want a more intelligent conversation and aim to ensure the overall context of the entire conversation history remains accurate.',
  },
]
export const HAS_MAX_TOKEN_LIMIT = [
  'conversation_token_buffer_memory',
  'summary_memory',
]
export const HAS_K = ['conversation_buffer_window_memory']
