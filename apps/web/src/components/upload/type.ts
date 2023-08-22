import { ReactNode } from 'react'
import { CancelTokenSource } from 'axios'
import type {
  RcFile as OriRcFile,
  UploadRequestOption as RcCustomRequestOptions,
  UploadProps as RcUploadProps,
} from 'rc-upload/lib/interface'

import { FileProps } from './utils'

export interface HttpRequestHeader {
  [key: string]: string
}

export interface InternalUploadFile<T = any> extends UploadFile<T> {
  originFileObj: RcFile
}

// ----------------------------------------------------------------------
export type UploadFileStatus =
  | 'error'
  | 'success'
  | 'done'
  | 'uploading'
  | 'removed'

export interface CustomFile extends File {
  progress?: number
  path?: string
  preview?: string
  lastModifiedDate?: Date
  indexStatus?: number
}

export interface UploadedFile {
  name: string
  url: string
  process?: number
}

export function isUploadedFile(obj: any): obj is UploadedFile {
  return obj !== null && 'name' in obj && 'url' in obj
}
export interface RcFile extends OriRcFile {
  readonly lastModifiedDate: Date
}

export interface UploadFile<T = any> {
  uid: string
  size?: number
  name: string
  lastModified?: number
  url?: string
  status?: UploadFileStatus
  percent?: number
  originFileObj?: File
  response?: T
  error?: any
  type?: string
  preview?: string
}

export type BeforeUploadValueType = void | boolean | string | Blob | File

export interface UploadChangeParam<T = UploadFile> {
  // https://github.com/ant-design/ant-design/issues/14420
  file: T
  fileList: T[]
  event?: { percent: number }
}

export interface UploadProps<T = any> extends Pick<RcUploadProps, 'capture'> {
  name?: string
  controller?: AbortController
  onChangeFileList?: (files: FileProps[]) => void
  setUploading?: (s: boolean) => void
  bgColor?: string
  bgText?: string
  fileType?: string
  defaultFileList?: Array<UploadFile<T>>
  showFileList?: boolean
  fileList?: FileProps[]
  type?: 'drag' | 'select'
  listType?: 'images-list' | 'pdf' | 'image' | 'update-image'
  action?:
    | string
    | ((file: RcFile) => string)
    | ((file: RcFile) => PromiseLike<string>)
  data?:
    | Record<string, unknown>
    | ((
        file: UploadFile<T>
      ) => Record<string, unknown> | Promise<Record<string, unknown>>)
  method?: 'POST' | 'PUT' | 'PATCH' | 'post' | 'put' | 'patch'
  headers?: HttpRequestHeader
  listProps?: boolean | listPropsInterface
  multiple?: boolean
  accept?: string
  beforeUpload?: (
    file: RcFile,
    FileList: RcFile[]
  ) => BeforeUploadValueType | Promise<BeforeUploadValueType>
  onChange?: (info: UploadChangeParam<UploadFile<T>>) => void
  onDrop?: (event: React.DragEvent<HTMLDivElement>) => void
  className?: string
  fileNameStyle?: string
  onPreview?: (file: UploadFile<T>) => void
  onDownload?: (file: UploadFile<T>) => void
  onRemove?: (file: UploadFile<T>) => void | boolean | Promise<void | boolean>
  customRequest?: (options: RcCustomRequestOptions) => void
  withCredentials?: boolean
  openFileDialogOnClick?: boolean
  locale?: UploadLocale
  progress?: ReactNode
  maxCount?: number
  children?: React.ReactNode
  disabled?: boolean
}

export interface listPropsInterface<T = any> {
  showRemoveIcon?: boolean
  showPreviewIcon?: boolean
  showDownloadIcon?: boolean
  removeIcon?: React.ReactNode
  downloadIcon?: React.ReactNode
  previewIcon?: React.ReactNode
}

export interface UploadLocale {
  uploading?: string | ReactNode
  removeFile?: string | ReactNode
  downloadFile?: string | ReactNode
  uploadError?: string | ReactNode
  previewFile?: string | ReactNode
}

export interface UploadState<T = any> {
  fileList: UploadFile<T>[]
  dragState: string
}
export interface FileItemProps<T = any> {
  onPreview?: (file: UploadFile<T>) => void
  onDownload?: (file: UploadFile<T>) => void
  onRemove?: (file: UploadFile<T>) => void | boolean | Promise<boolean | void>
  file: UploadFile
  progress?: ReactNode | number
  className?: string
  listProps?: boolean | listPropsInterface
  fileNameStyle?: string
  locale?: UploadLocale
}

export interface FilePercent {
  uid?: string
  percent?: number
}

export interface UploadFileProps {
  file: UploadFile
  mergedFileList: UploadFile<any>[]
  fileType?: string
  controller?: AbortController
  source?: CancelTokenSource
  process?: FilePercent[]
  onChangeFileList?: (files: FileProps[]) => void
  setMergedFileList?: (files: UploadFile<any>[]) => void
  setIsUploading: (s: boolean) => void
  setProcess?: (s: FilePercent[]) => void
}
