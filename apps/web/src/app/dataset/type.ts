import { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import { FileProps } from '@/components/upload/utils'

export const FormSchema = z.object({
  name: z
    .string()
    .nonempty('Dataset name is required.')
    .max(50, { message: 'Dataset name must be less than 50 characters.' }),
  embeddingType: z.string().optional(),
  storeType: z.string().optional(),
  collectionName: z.string().optional(),
  chromaUrl: z.string().optional(),
  apiKey: z.string().optional(),
  instanceName: z.string().optional(),
  developmentName: z.string().optional(),
  apiVersion: z.string().optional(),
})

const FileSchema = z.array(
  z.object({
    name: z.string(),
    url: z.string().optional(), //pdf
    type: z.string(),
    uid: z.string(),
    short_id: z.string().optional(), //noted data
  })
)

export const DataSchema = z.object({
  loaderType: z.string().optional(),
  splitType: z.string().optional(),
  chunkSize: z.number().optional(),
  chunkOverlap: z.number().optional(),
  files: FileSchema,
  notedData: FileSchema,
})

export type LoaderTypeProps = 'pdf' | 'annotated_data' | 'word'

export type DataBaseProps = {
  type: LoaderTypeProps
  short_id?: string
  uid: string
  icon?: string
  name: string
  app_id?: string
}

export type DocumentProps = DataBaseProps & {
  status: 0 | 1 | 2
  characters?: number
  updated_at: Date
  url: string
}

export type FileSplitConfigProps = {
  splitType: string
  chunkSize: number
  chunkOverlap: number
}

export type DocumentParamsType = {
  uid: string
  url: string
  type: string
  split_option: {
    split_type?: string
    chunk_size?: number
    chunk_overlap?: number
  }
}

export type SchemaProps = z.infer<typeof FormSchema>

export type DataSchemeProps = z.infer<typeof DataSchema>

export type DataProps = DocumentProps & FileSplitConfigProps
export type SegmentProps = {
  content: string
  index?: string
  segment_id?: string
}

export type SessionProps = {
  form: UseFormReturn<any>
  files?: FileProps[]
}

export type DocumentFormProps = {
  files: FileProps[]
  config: FileSplitConfigProps & { loaderType: LoaderTypeProps }
}
