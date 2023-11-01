'use client'

import { useState } from 'react'

import { RcFile } from '@/components/upload/type'
import Upload from '@/components/upload/upload'
import { FileProps } from '@/components/upload/utils'

const UploadScenes = () => {
  const defaultPdf = {
    url: 'https://storage.googleapis.com/context-builder/public-tmp/tbkDzOBF4Fat.pdf',
    name: 'test.pdf',
  }
  const defaultUrl = {
    url: ' https://backend.withcontext.ai/backend/upload/2023/04/65947928-68d6-4f64-99d9-0b98578fe4c6.jpeg',
    name: '1.jpeg',
  }
  const [files, setFiles] = useState<FileProps[]>([defaultPdf])
  const [images, setImages] = useState<FileProps[]>([defaultUrl])
  const [image, setImage] = useState<FileProps[]>([])

  const [current, setCurrent] = useState<FileProps[]>([])
  const [dragFile, setDragFile] = useState<FileProps[]>([])

  const beforeUpload = (info: RcFile) => {
    if (info?.size > 1024 * 1024 * 5) {
      return false
    }
    return true
  }
  return (
    <div className="w-[960px] space-y-8 p-6">
      <section className="flex w-[600px] flex-col justify-start space-y-3">
        <h1 className="text-xl	">pdf list</h1>
        <Upload
          fileList={files}
          accept=".pdf"
          beforeUpload={beforeUpload}
          // default show all icons(delete, preview & download),if listProps=false show no icon
          /***
           * default api is google cloud , just use onChangeFileList to get the uploadFiles you need
           * you can also to by onChange to use your own api
           *  */
          onChangeFileList={(files) => {
            setFiles([...files])
          }}
        />
      </section>

      <section className="flex w-[600px] flex-col justify-start space-y-3">
        <h1 className="text-xl	"> show default image list</h1>
        <Upload
          listType="images-list"
          accept=".png,jpeg,.jpg,.webp"
          fileList={images}
          onChangeFileList={(files) => setImages([...files])}
        />
      </section>

      <section className="flex w-[600px] flex-col justify-start space-y-3">
        <h1 className="text-xl">
          image: one step: delete the image ,tow step:upload a new
        </h1>
        <Upload
          listType="image"
          fileList={image}
          accept=".png,jpeg,.jpg,.webp"
          onChangeFileList={(files) => setImage(files)}
        />
      </section>

      <section className="flex w-[600px] flex-col justify-start space-y-3">
        <h1 className="text-xl">
          update image: just one step upload a new and to update the current
        </h1>

        <Upload
          listType="update-image"
          accept=".png,jpeg,.jpg,.webp"
          fileList={current}
          onChangeFileList={(files) => {
            setCurrent(files)
          }}
        />
      </section>

      <section className="flex w-[600px] flex-col justify-start space-y-3">
        <h1 className="text-xl">drag multiple files</h1>
        <Upload
          fileList={dragFile}
          type="drag"
          onChangeFileList={(files) => setDragFile([...files])}
          // onRemove={handleRemove}
        />
      </section>
    </div>
  )
}

export default UploadScenes
