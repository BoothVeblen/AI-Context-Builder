'use client'

import { RefObject, useMemo, useRef, useState } from 'react'
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
  config,
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
  const defaultValues = useMemo(() => ({ name, ...config }), [config, name])

  return (
    <div className="absolute inset-0 flex h-full w-full bg-white">
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
