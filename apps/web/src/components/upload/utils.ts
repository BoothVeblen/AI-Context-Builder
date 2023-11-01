import axios from 'axios'
import { pick } from 'lodash'

import { nanoid } from '@/lib/utils'

import type {
  FilePercent,
  InternalUploadFile,
  RcFile,
  UploadFile,
  UploadFileProps,
  UploadFileStatus,
} from './type'
import { listPropsInterface } from './type'

export function file2Obj(file: RcFile, fileType?: string): InternalUploadFile {
  return {
    ...file,
    lastModified: file.lastModified,
    name: file.name,
    size: file.size,
    type: fileType || file.type,
    uid: nanoid(),
    percent: 0,
    url: '',
    originFileObj: file,
  }
}

export const checkShowIcon = (listProps: boolean | listPropsInterface) => {
  if (typeof listProps === 'object') {
    return { show: true, ...listProps }
  } else {
    return { show: listProps }
  }
}

export const getBase64 = (img: RcFile, callback: (url: string) => void) => {
  const reader = new FileReader()
  reader.addEventListener('load', () => callback(reader.result as string))
  reader.readAsDataURL(img)
}

export const handleSuccess = ({
  setMergedFileList,
  onChangeFileList,
}: {
  setMergedFileList?: (s: any) => void
  onChangeFileList?: (files: FileProps[]) => void
}) => {
  setMergedFileList?.((files: UploadFile[]) => {
    const success = files?.filter(
      (item) => item?.status === 'success' && item?.url
    )
    const data = success?.reduce((m: FileProps[], item: UploadFile) => {
      const cur = pick(item, ['url', 'uid', 'type', 'name'])
      m.push(cur)
      return m
    }, [])
    onChangeFileList?.(data)
    return files
  })
}

const handelProcess = (file: UploadFile, setProcess?: any) => {
  // add dynamic process to file
  setProcess?.((allProcess: FilePercent[]) => {
    const processIndex =
      allProcess?.findIndex((item) => item?.uid === file?.uid) || 0
    if (processIndex !== -1) {
      const left = allProcess.slice(0, processIndex)
      const right = allProcess.slice(processIndex + 1)
      const updated = { uid: file?.uid, percent: file?.percent }
      const newProcess = [...left, updated, ...right]
      return newProcess
    } else {
      return [...allProcess, { uid: file?.uid, percent: file?.percent }]
    }
  })
}

export const uploadFile = async ({
  file,
  setMergedFileList,
  aborts,
  setProcess,
  onChangeFileList,
}: UploadFileProps) => {
  if (!file) return
  file.status = 'uploading'
  const filename = encodeURIComponent(file?.name || '')
  const res = await fetch(`/api/upload-url/gcp?filename=${filename}`)
  const { success, data } = await res.json()
  if (!success) {
    file.status = 'error'
  }
  const { upload_url, upload_fields, file_url } = data as {
    provider: string
    upload_url: string
    upload_fields: { [key: string]: string }
    file_url: string
    file_path: string
  }
  const formData = new FormData()
  Object.entries({ ...upload_fields, file: file?.originFileObj }).forEach(
    ([key, value]) => {
      // @ts-ignore
      formData.append(key, value)
    }
  )
  const abort = new AbortController()
  aborts.current?.push({ uid: file?.uid, control: abort })
  const current = aborts?.current?.find((item) => item?.uid === file?.uid)
  axios
    .post(upload_url, formData, {
      signal: current?.control?.signal,
      onUploadProgress: async (progressEvent) => {
        const { progress = 0 } = progressEvent
        file.percent = progress * 100
        await handelProcess(file, setProcess)
      },
    })
    .then(async () => {
      file.status = 'success'
      file.url = file_url
      handleSuccess({
        setMergedFileList,
        onChangeFileList,
      })
    })
    .catch(async (error) => {
      file.status = 'error'
      console.error(error)
    })
}

export const stringUrlToFile = (url: string) => {
  const status: UploadFileStatus = 'success'
  return url
    ? [
        {
          url,
          name: '',
          uid: nanoid(),
          status,
        },
      ]
    : []
}

export type FileProps = {
  name: string
  url: string
  uid?: string
  type?: string
}
export const changeToUploadFile = (
  value: Array<FileProps | string> | string
) => {
  const isFiles = Array.isArray(value)
  if (isFiles) {
    const data = value?.reduce((m: UploadFile[], item: FileProps | string) => {
      const isImage = typeof item === 'string'
      const status: UploadFileStatus = 'success'
      const cur = isImage ? stringUrlToFile(item)[0] : { ...item, status }
      m.push(cur as UploadFile)
      return m
    }, [])
    return data
  } else {
    return stringUrlToFile(value)
  }
}
