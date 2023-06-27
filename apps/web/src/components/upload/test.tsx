'use client'

import { useState } from 'react'

import { UploadFile, UploadProps } from './type'
import Upload from './upload'

const TestUpload = (props: UploadProps) => {
  const [files, setFiles] = useState<UploadFile[]>([])

  const handleRemove = (file: UploadFile) => {
    const data = files?.filter((item) => item?.uid !== file?.uid)
    setFiles(data)
  }
  return (
    <Upload
      fileList={files}
      handleFiles={(files) => setFiles([...files])}
      onRemove={handleRemove}
      // 自定义请求方式，这里在onChange阶段调用的Google cloud，不处理会使用rc-upload的请求方式多发送一次请求
      customRequest={() => {}}
      {...props}
    />
  )
}

export default TestUpload
