import axios, { CancelTokenSource } from 'axios'

import type { InternalUploadFile, RcFile, UploadFile } from './type'
import { ShowUploadListInterface } from './type'

export function file2Obj(file: RcFile): InternalUploadFile {
  return {
    ...file,
    lastModified: file.lastModified,
    lastModifiedDate: file.lastModifiedDate,
    name: file.name,
    size: file.size,
    type: file.type,
    uid: file.uid,
    percent: 0,
    originFileObj: file,
  }
}

/** Upload fileList. Replace file if exist or just push into it. */
export function updateFileList(
  file: UploadFile,
  fileList: (UploadFile | Readonly<UploadFile>)[]
) {
  const nextFileList = [...fileList]
  const fileIndex = nextFileList.findIndex(({ uid }) => uid === file.uid)
  if (fileIndex === -1) {
    nextFileList.push(file)
  } else {
    nextFileList[fileIndex] = file
  }
  return nextFileList
}

export function getFileItem(
  file: RcFile,
  fileList: (UploadFile | Readonly<UploadFile>)[]
) {
  const matchKey = file.uid !== undefined ? 'uid' : 'name'
  return fileList.filter((item) => item[matchKey] === file[matchKey])[0]
}

export function removeFileItem(
  file: UploadFile,
  fileList: (UploadFile | Readonly<UploadFile>)[]
) {
  const matchKey = file.uid !== undefined ? 'uid' : 'name'
  const removed = fileList.filter((item) => item[matchKey] !== file[matchKey])
  if (removed.length === fileList.length) {
    return null
  }
  return removed
}

export const checkShowIcon = (
  showUploadList: boolean | ShowUploadListInterface
) => {
  if (typeof showUploadList === 'object') {
    return { show: true, ...showUploadList }
  } else {
    return { show: showUploadList }
  }
}

export const checkType = (file: UploadFile) => {
  if (file?.type !== 'application/pdf' || file?.url?.includes('.pdf')) {
    return 'isPDF'
  }
  return 'isImage'
}

export const getBase64 = (img: RcFile, callback: (url: string) => void) => {
  const reader = new FileReader()
  reader.addEventListener('load', () => callback(reader.result as string))
  reader.readAsDataURL(img)
}

const changeCurrentFile = async (
  file: UploadFile,
  fileList: UploadFile[],
  handleFiles?: (files: UploadFile<any>[]) => void
) => {
  const index = fileList?.indexOf(
    // @ts-ignore
    (item: { uid: any }) => item?.uid === file?.uid
  )
  if (index !== -1) {
    fileList[index] = file
  }
  handleFiles?.(fileList)
}

export const uploadFile = async ({
  file,
  fileList,
  controller,
  handleFiles,
  source,
}: {
  file: UploadFile
  fileList: UploadFile[]
  source?: CancelTokenSource
  controller?: AbortController
  handleFiles?: (files: UploadFile<any>[]) => void
}) => {
  if (!file) return
  file.status = 'uploading'
  file.percent = 0
  await changeCurrentFile(file, fileList, handleFiles)
  const filename = encodeURIComponent(file?.name || '')
  const res = await fetch(`/api/upload-url/gcp?filename=${filename}`)
  const { success, data } = await res.json()
  if (!success) {
    file.status = 'error'
    await changeCurrentFile(file, fileList, handleFiles)
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
  axios
    .post(upload_url, formData, {
      signal: controller?.signal,
      cancelToken: source?.token,
      onUploadProgress: async (progressEvent) => {
        file.status = 'uploading'
        const { progress = 0 } = progressEvent
        file.percent = progress * 100
        await changeCurrentFile(file, fileList, handleFiles)
      },
    })
    .then(async () => {
      file.status = 'success'
      file.url = file_url
      await changeCurrentFile(file, fileList, handleFiles)
    })
    .catch((error) => {
      if (axios.isCancel(error)) {
        console.log('Request canceled', error.message)
      }
      file.status = 'error'
      console.error(error)
    })
}
