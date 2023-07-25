'use client'

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

import SearchSelect from './search-select'
import { SessionProps } from './splitter'

const types = [
  { label: 'OpenAI Embedding', value: 'openAI' },
  { label: 'More Coming Soon...', value: 'coming soon' },
]

const TextEmbedding = ({ form, sectionRef }: SessionProps) => {
  return (
    <section
      id="models"
      className="w-full border-b-[1px] py-6"
      ref={sectionRef}
    >
      <div className="mb-6 text-2xl font-semibold leading-8">
        Text Embedding Models
      </div>
      <div className="mb-6	text-sm font-normal leading-6 text-slate-600">
        The Embeddings class is a class designed for interfacing with text
        embedding models. There are lots of embedding model providers (OpenAI,
        Cohere, Hugging Face, etc) - this class is designed to provide a
        standard interface for all of them.
      </div>
      <SearchSelect
        form={form}
        name="embeddingType"
        values={types}
        title="Text Embedding Models"
      />
      <FormField
        control={form.control}
        name="apiKey"
        render={({ field }) => (
          <FormItem className="my-6 w-[332px]">
            <FormLabel className="flex">Azure OpenAI Api Key</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="instanceName"
        render={({ field }) => (
          <FormItem className="my-6 w-[332px]">
            <FormLabel className="flex">
              Azure OpenAI Api Instance Name
            </FormLabel>
            <FormControl>
              <Input placeholder="YOUR-INSTANCE-NAME" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="developmentName"
        render={({ field }) => (
          <FormItem className="my-6 w-[332px]">
            <FormLabel className="flex">
              Azure OpenAI Api Deployment Name
            </FormLabel>
            <FormControl>
              <Input placeholder="YOUR-DEPLOYMENT-NAME" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="apiVersion"
        render={({ field }) => (
          <FormItem className="w-[332px]">
            <FormLabel className="flex">Azure OpenAI Api Version</FormLabel>
            <FormControl>
              <Input placeholder="YOUR-API-VERSION" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </section>
  )
}
export default TextEmbedding
