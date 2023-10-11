'use client'

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { SessionProps } from '@/app/dataset/type'

import SearchSelect from '../../settings/documents/search-select'

const types = [
  { label: 'Character Text Splitter', value: 'character' },
  { label: 'More Coming Soon...', value: 'coming soon' },
]

const TextSplits = ({ form }: SessionProps) => {
  return (
    <section id="splitters" className="w-full py-6">
      <div className="mb-6 text-sm font-normal leading-6 text-slate-600">
        When you want to deal with long pieces of text, it is necessary to split
        up that text into chunks. As simple as this sounds, there is a lot of
        potential complexity here. Ideally, you want to keep the semantically
        related pieces of text together. What &quot;semantically related&quot;
        means could depend on the type of text. This notebook showcases several
        ways to do that.
      </div>
      <SearchSelect
        form={form}
        name="splitType"
        values={types}
        title="Text Splitters"
      />
      <FormField
        control={form.control}
        name="chunkSize"
        render={({ field }) => (
          <FormItem className="my-6 w-[332px]">
            <FormLabel className="flex">Chunk size</FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder="Input your chunk size"
                {...field}
                onChange={(e) => {
                  const value = +e.target.value
                  field.onChange(value as any)
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="chunkOverlap"
        render={({ field }) => (
          <FormItem className="w-[332px]">
            <FormLabel className="flex">Chunk overlap</FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder="Input your chunk overlap"
                {...field}
                onChange={(e) => {
                  const value = +e.target.value
                  field.onChange(value as any)
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </section>
  )
}

export default TextSplits
