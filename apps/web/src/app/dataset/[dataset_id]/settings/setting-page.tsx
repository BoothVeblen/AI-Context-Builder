'use client'

import { RefObject, useEffect, useMemo, useRef, useState } from 'react'
import { z } from 'zod'

import useScrollSpy from '@/hooks/use-scroll-spy'

import DatasetForm from './dataset-form'
import SlideBar from './sidebar'
import { FormSchema } from './utils'

export interface SectionType {
  ref?: RefObject<HTMLElement>
  title: string
  name: string
}

export type SchemaProps = z.infer<typeof FormSchema>

const DatasetSetting = ({
  name = '',
  config = {},
  datasetId,
}: {
  name?: string
  config?: Record<string, any>
  datasetId?: string
}) => {
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

  const [showMore, setShowMore] = useState<boolean>(false)

  const defaultValues = useMemo(() => {
    // some loaderType is pdf loader .now change to pdf
    config.loaderType = config?.loaderType?.includes('pdf')
      ? 'pdf'
      : config.loaderType
    config.splitType = config?.splitType?.includes('character')
      ? 'character'
      : config?.splitType
    config.embeddingType = config?.embeddingType?.includes('openAI')
      ? 'openAI'
      : config.embeddingType
    return { name, ...config }
  }, [config, name])

  return (
    <div className="absolute inset-0 hidden h-full w-full bg-white lg:flex">
      <div className="w-[276px] border-r border-slate-200 bg-slate-50">
        <SlideBar
          showMore={showMore}
          scrollRef={scrollRef}
          datasetId={datasetId}
          name={name}
          activeSection={activeSection}
        />
      </div>
      <DatasetForm
        datasetId={datasetId}
        showMore={showMore}
        defaultValues={defaultValues}
        files={config?.files}
        setShowMore={setShowMore}
        scrollRef={scrollRef}
        sectionRefs={sectionRefs}
      />
    </div>
  )
}

export default DatasetSetting
