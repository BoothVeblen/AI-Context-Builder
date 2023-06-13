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
