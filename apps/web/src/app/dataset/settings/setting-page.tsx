'use client'

import { RefObject, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { difference } from 'lodash'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import useScrollSpy from '@/hooks/use-scroll-spy'

import DatasetForm from './dataset-form'
import SlideBar from './sidebar'

export interface SectionType {
  ref?: RefObject<HTMLElement>
  title: string
  name: string
}

const FormSchema = z.object({
  name: z
    .string()
    .nonempty('Dataset name is required.')
    .max(50, { message: 'Dataset name must be less than 50 characters.' }),
  loaderType: z.string().optional(),
  splitType: z.string().optional(),
  embeddingTyp: z.string().optional(),
  files: z.array(z.string()).optional(),
  chunkSize: z.number(),
  chunkOverlap: z.number(),
  storeType: z.string(),
  collectionName: z.string().optional(),
  chromaUrl: z.string().optional(),
  apiKey: z.string().optional(),
  instanceName: z.string().optional(),
  developmentName: z.string().optional(),
  apiVersion: z.string().optional(),
})

export type SchemaProps = z.infer<typeof FormSchema>

const DatasetSetting = ({ defaultValue }: { defaultValue?: SchemaProps }) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const sectionRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ]
  const activeSection = useScrollSpy({
    scrollingElement: scrollRef,
    sectionElementRefs: sectionRefs,
    offsetPx: -10,
  })

  const [error, setError] = useState<string>('')
  const [saved, setSaved] = useState<boolean>(false)
  const router = useRouter()
  const [showMore, setShowMore] = useState<boolean>(false)
  const defaultValues = useMemo(
    () =>
      defaultValue || {
        name: '',
        loaderType: 'pdf loader',
        splitType: 'character textsplitter',
        files: [],
        chunkSize: 1000,
        chunkOverlap: 1000,
        embeddingType: 'openAI embedding',
        storeType: 'pinecone',
        collectionName: '',
        chromaUrl: '',
        apiKey: '',
        instanceName: '',
        developmentName: '',
        apiVersion: '',
      },
    [defaultValue]
  )

  const checkIsUpdate = () => {
    const current = form.getValues()
    // @ts-ignore
    if (difference(current?.files, defaultValues?.files)?.length) {
      return true
    }
    for (let k in current) {
      // @ts-ignore
      if (k !== 'files' && current?.[k] !== defaultValues?.[k]) {
        return true
      }
    }
    return false
  }

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues,
  })

  const handleGoBack = () => {
    const update = checkIsUpdate()
    if (!saved && update) {
      setError('Your changes have not been published yet!')
    } else {
      router.back()
    }
  }

  return (
    <div className="absolute inset-0 flex h-full w-full bg-white">
      <div className="w-[276px] border-r border-slate-200 bg-slate-50">
        <SlideBar
          handleGoBack={handleGoBack}
          showMore={showMore}
          scrollRef={scrollRef}
          activeSection={activeSection}
        />
      </div>
      <DatasetForm
        showMore={showMore}
        error={error}
        setError={setError}
        setSaved={setSaved}
        form={form}
        setShowMore={setShowMore}
        scrollRef={scrollRef}
        sectionRefs={sectionRefs}
      />
    </div>
  )
}

export default DatasetSetting
