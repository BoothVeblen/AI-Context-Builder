'use client'

import {
  InputItem,
  ListSelectItem,
  SelectItem,
  SlideItem,
  TextareaItem,
} from './form-item'

const MODELS_OPTIONS = [
  { label: 'OpenAI-GPT3.5', value: 'openai-gpt3dot5' },
  { label: 'OpenAI-GPT4', value: 'openai-gpt4' },
]

const DATASETS_OPTIONS = [
  { label: 'Customer service documentation', value: 'd1' },
  { label: 'This is a Document with very very very long title.', value: 'd2' },
]

export default function TaskDetail() {
  return (
    <div className="space-y-6 p-6">
      <h2 className="text-lg font-semibold">Conversational Retrieval QA</h2>
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="text-sm font-medium text-slate-500">LLM</div>
          <div className="space-y-8">
            <SelectItem
              name="model_name"
              label="Model"
              options={MODELS_OPTIONS}
            />
            <SlideItem
              name="model_temperature"
              label="Temperature"
              min={0}
              max={2}
              step={0.1}
            />
          </div>
        </div>

        <div className="-mx-6 h-px shrink-0 bg-slate-100" />

        <div className="space-y-4">
          <div className="text-sm font-medium text-slate-500">memory</div>
          <div className="space-y-8">
            <InputItem name="memory_key" label="Memory Key" />
          </div>
        </div>

        <div className="-mx-6 h-px shrink-0 bg-slate-100" />

        <div className="space-y-4">
          <div className="text-sm font-medium text-slate-500">prompt</div>
          <div className="space-y-8">
            <TextareaItem name="prompt_template" label="Template" />
          </div>
        </div>

        <div className="-mx-6 h-px shrink-0 bg-slate-100" />

        <div className="space-y-4">
          <div className="text-sm font-medium text-slate-500">data</div>
          <div className="space-y-8">
            <ListSelectItem
              name="data_datasets"
              label="Dataset"
              options={DATASETS_OPTIONS}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
