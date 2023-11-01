'use client'

import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { FileType, UPLOAD_ACCEPT_MAP } from '@/components/upload/type'
import Upload from '@/components/upload/upload'
import { FileProps } from '@/components/upload/utils'

import { DocumentProps, SessionProps } from '../../../type'
import SearchSelect from '../../settings/documents/search-select'
import { useDataContext } from './data-context'
import AddAnnotatedData from './noted-data-alert'

const types = [
  { label: 'PDF loader', value: 'pdf' },
  { label: 'Microsoft Word Loader', value: 'word' },
  { label: 'Annotated data', value: 'annotated_data' },
  { label: 'More Coming Soon...', value: 'coming soon' },
]
interface IProps extends SessionProps {
  apps?: DocumentProps[]
}

const DocumentLoader = ({ form }: IProps) => {
  const { isAdd } = useDataContext()

  const { getValues, setValue } = form
  const files = getValues()?.files
  const onChangeFileList = (values: FileProps[]) => {
    setValue('files', [...values])
  }
  const formValues = getValues()
  const loaderType = formValues?.loaderType
  const isNotedData = loaderType === 'annotated_data'

  return (
    <section id="loaders" className="w-full py-6">
      <div className="mb-6 text-sm font-normal leading-6 text-slate-600">
        Use document loaders to load data from a source as documents. A Document
        is a piece of text and associated metadata. For example, there are
        document loaders for loading a simple .txt file, for loading the text
        contents of any web page, or even for loading a transcript of a YouTube
        video.
      </div>
      <SearchSelect
        form={form}
        values={types}
        name="loaderType"
        label={
          <div className="flex">
            Data Source<div className="text-red-500">*</div>
          </div>
        }
        title="Document Loader"
      />
      <FormField
        control={form.control}
        name="files"
        render={(field) => {
          return (
            <FormItem className="w-[332px]">
              <FormControl>
                {!isNotedData ? (
                  <Upload
                    className="items-start justify-start"
                    listProps={{
                      showDownloadIcon: false,
                      showPreviewIcon: false,
                    }}
                    listType={isAdd ? 'files' : 'update-file'}
                    type="drag"
                    fileType={loaderType}
                    accept={UPLOAD_ACCEPT_MAP[loaderType as FileType]}
                    multiple={isAdd}
                    fileList={files}
                    onChangeFileList={onChangeFileList}
                  />
                ) : (
                  <AddAnnotatedData form={form} />
                )}
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
