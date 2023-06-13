'use client'

import { useState } from 'react'
import axios from 'axios'

import { UploadFile, UploadProps } from './type'
import Upload from './upload'

const TestUpload = (props: UploadProps) => {
  const [files, setFiles] = useState<UploadFile[]>([])

  const changeFile = async (file: UploadFile, fileList: UploadFile[]) => {
    const index = fileList?.indexOf(
      // @ts-ignore
      (item: { uid: any }) => item?.uid === file?.uid
    )
    if (index !== -1) {
      fileList[index] = file
    }
    setFiles([...files, ...fileList])
  }
  const onChange = async ({
    file,
    fileList,
  }: {
    file: UploadFile
    fileList: UploadFile[]
  }) => {
    file.status = 'uploading'
    file.percent = 0
    changeFile(file, fileList)
    if (!file) return
    const filename = encodeURIComponent(file?.name || '')
    const res = await fetch(`/api/upload-url/gcp?filename=${filename}`)
    const { success, data } = await res.json()
    if (!success) {
      file.status = 'error'
      changeFile(file, fileList)
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
        onUploadProgress: (progressEvent) => {
          file.status = 'uploading'
          console.log('progressEvent:', progressEvent)
          const { progress = 0 } = progressEvent
          file.percent = progress * 100
          changeFile(file, fileList)
        },
      })
      .then(() => {
        file.status = 'success'
        file.url = file_url
        changeFile(file, fileList)
      })
      .catch((error) => {
        file.status = 'error'
        console.error(error)
      })
  }

  const handleRemove = (file: UploadFile) => {
    const data = files?.filter((item) => item?.uid !== file?.uid)
    setFiles(data)
  }

  return (
    <Upload
      fileList={files}
      onChange={onChange}
      onRemove={handleRemove}
      // 自定义请求方式，这里在onChange阶段调用的Google cloud，不处理会使用rc-upload的请求方式多发送一次请求
      customRequest={() => {}}
      {...props}
    />
  )
}

export default TestUpload
