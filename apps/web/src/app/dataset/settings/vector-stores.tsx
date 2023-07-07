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
  { label: 'Pinecone', value: 'pinecone' },
  { label: 'Coming soon...', value: 'coming soon' },
]

const VectorStores = ({ form, sectionRef }: SessionProps) => {
  return (
    <section
      id="stores"
      className="w-full border-b-[1px] py-6"
      ref={sectionRef}
    >
      <div className="mb-6 text-2xl font-semibold leading-8">Vector Stores</div>
      <div className="mb-6	text-sm font-normal leading-6 text-slate-600">
        One of the most common ways to store and search over unstructured data
        is to embed it and store the resulting embedding vectors, and then at
        query time to embed the unstructured query and retrieve the embedding
        vectors that are &apos;most similar&apos; to the embedded query. A
        vector store takes care of storing embedded data and performing vector
        search for you.
      </div>
      <SearchSelect
        form={form}
        name="storeType"
        values={types}
        title="Vector Stores"
      />
      <FormField
        control={form.control}
        name="collectionName"
        render={({ field }) => (
          <FormItem className="my-6 w-[332px]">
            <FormLabel className="flex">Collection Name</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="chromaUrl"
        render={({ field }) => (
          <FormItem className="w-[332px]">
            <FormLabel className="flex">Chroma URL</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </section>
  )
}

export default VectorStores
