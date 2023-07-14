'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { nanoid } from 'nanoid'

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { UploadFile, UploadFileStatus } from '@/components/upload/type'
import Upload from '@/components/upload/upload'

import SearchSelect from './search-select'
import { SessionProps } from './splitter'

const types = [
  { label: 'PDF loader', value: 'pdf loader' },
  { label: 'More Coming Soon...', value: 'coming soon' },
]

export interface FileProps {
  name?: string
  url?: string
}

export const stringUrlToFile = (file: FileProps) => {
  const status: UploadFileStatus = 'success'
  return {
    url: file?.url || '',
    name: file?.name || '',
    uid: nanoid(),
    status,
  }
}

interface IProps extends SessionProps {
  data: UploadFile<any>[]
  setData: (data: UploadFile<any>[]) => void
}

const DocumentLoader = ({ form, sectionRef, setData, data }: IProps) => {
  const getSuccessFile = (values: UploadFile[]) => {
    const success = values
      ?.filter((item) => item?.url && item?.status === 'success')
      ?.reduce((m: FileProps[], file: UploadFile) => {
        m?.push({ url: file?.url || '', name: file?.name || '' })
        return m
      }, [])
    form.setValue('files', [...success])
  }
  const handleFiles = (values: UploadFile[]) => {
    setData([...values])
    getSuccessFile(values)
  }

  const handleRemove = (file: UploadFile) => {
    const newData = data?.filter((item) => item?.uid !== file?.uid)
    setData([...newData])
    getSuccessFile(newData)
  }
  return (
    <section
      id="loaders"
      className="w-full border-b-[1px] py-6"
      ref={sectionRef}
    >
      <div className="mb-6 text-2xl font-semibold leading-8">
        Document Loaders
      </div>
      <div className="mb-6 text-sm font-normal leading-6 text-slate-600">
        Use document loaders to load data from a source as Document&apos;s. A
        Document is a piece of text and associated metadata. For example, there
        are document loaders for loading a simple .txt file, for loading the
        text contents of any web page, or even for loading a transcript of a
        YouTube video.
      </div>
      <SearchSelect
        form={form}
        values={types}
        name="loaderType"
        title="Document Loader"
        isRequired={true}
      />
      <FormField
        control={form.control}
        name="files"
        render={(field) => {
          return (
            <FormItem className="w-[332px]">
              <FormLabel>Files</FormLabel>
              <FormControl>
                <Upload
                  className="items-start justify-start"
                  showUploadList={{
                    showDownloadIcon: false,
                    showPreviewIcon: false,
                  }}
                  onRemove={handleRemove}
                  listType="pdf"
                  accept="application/pdf"
                  fileList={data}
                  handleFiles={handleFiles}
                  customRequest={() => {}}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )
        }}
      />
    </section>
  )
}

export default DocumentLoader
