'use client'

import { useState } from 'react'

import { UploadProps } from './type'
import Upload from './upload'
import { FileProps } from './utils'

const TestUpload = (props: UploadProps) => {
  const [files, setFiles] = useState<FileProps[]>([])

  return (
    <Upload
      fileList={files}
      onChangeFileList={(files) => setFiles([...files])}
      // 自定义请求方式，这里在onChange阶段调用的Google cloud，不处理会使用rc-upload的请求方式多发送一次请求
      {...props}
    />
  )
}

export default TestUpload
