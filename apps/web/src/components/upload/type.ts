import { Dispatch, ReactNode, RefObject, SetStateAction } from 'react'
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

export interface RcFile extends OriRcFile {
  readonly lastModifiedDate: Date
}

export interface UploadFile<T = any> {
  uid: string
  size?: number
  name: string
  lastModified?: number
  url: string
  status?: UploadFileStatus
  percent?: number
  originFileObj?: File
  response?: T
  error?: any
  type: string
  preview?: string
}

export type BeforeUploadValueType = void | boolean | string | Blob | File

export interface UploadChangeParam<T = UploadFile> {
  // https://github.com/ant-design/ant-design/issues/14420
  file: T
  fileList: T[]
  event?: { percent: number }
}

export type ListTypeProps =
  | 'images-list'
  | 'files'
  | 'image'
  | 'update-image'
  | 'update-file'

export type FileType = 'pdf' | 'word' | 'image'
export interface UploadProps<T = any> extends Pick<RcUploadProps, 'capture'> {
  name?: string
  onChangeFileList?: (files: FileProps[]) => void
  setUploading?: (s: boolean) => void
  bgColor?: string
  bgText?: string
  fileType?: FileType
  fileList?: FileProps[]
  type?: 'drag' | 'select'
  listType?: ListTypeProps
  action?:
    | string
    | ((file: RcFile) => string)
    | ((file: RcFile) => PromiseLike<string>)
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
  className?: string
  onPreview?: (file: UploadFile<T>) => void
  onDownload?: (file: UploadFile<T>) => void
  customRequest?: (options: RcCustomRequestOptions) => void
  withCredentials?: boolean
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

export interface FileItemProps<T = any> {
  onPreview?: (file: UploadFile<T>) => void
  onDownload?: (file: UploadFile<T>) => void
  onRemove?: (file: UploadFile<T>) => void | boolean | Promise<boolean | void>
  file: UploadFile
  listType?: ListTypeProps
  progress?: ReactNode | number
  className?: string
  listProps?: boolean | listPropsInterface
  locale?: UploadLocale
}

export interface FilePercent {
  uid?: string
  percent?: number
}

export interface UploadFileProps {
  file: UploadFile
  fileList: UploadFile<any>[]
  setMergedFileList?: Dispatch<SetStateAction<UploadFile<any>[]>>
  fileType?: string
  aborts: RefObject<AbortRef>
  source?: CancelTokenSource
  onChangeFileList?: (files: FileProps[]) => void
  setProcess?: (s: FilePercent[]) => void
}

export type AbortRef = { uid: string; control: AbortController }[]

export const UPLOAD_ACCEPT_MAP = {
  pdf: 'application/pdf',
  word: '.doc, .docx',
  image: '.png, .jpeg,.webp,.jpg',
}
