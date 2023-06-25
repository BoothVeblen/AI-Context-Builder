'use client'

import { useState } from 'react'
import axios from 'axios'

import { isImage, nanoid } from '@/lib/utils'

const UPLOAD_API_URL = 'http://localhost:3010/upload'
const UPLOAD_FOLDER_URL = 'http://localhost:3010/uploads'

export default function UploadInputLocal() {
  const [progress, setProgress] = useState(0)
  const [fileUrl, setFileUrl] = useState('')

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.currentTarget.files?.[0]
      if (!file) return

      const id = nanoid()
      const filename = encodeURIComponent(file.name)
      const ext = filename.split('.').pop()
      const newFilename = `${id}${ext ? `.${ext}` : ''}`
      const url = `${UPLOAD_FOLDER_URL}/${newFilename}`

      const formData = new FormData()
      formData.append('file', file, newFilename)

      axios
        .post(UPLOAD_API_URL, formData, {
          onUploadProgress: (progressEvent) => {
            console.log('progressEvent:', progressEvent)
            const { progress = 0 } = progressEvent
            setProgress(progress * 100)
          },
        })
        .then((res) => {
          console.log('upload success:', res)
          setFileUrl(url)
        })
        .catch((error) => {
          console.error(error)
        })
    } catch (error) {
      console.log('error:', error)
    }
  }

  return (
    <div className="flex flex-col space-y-2">
      <label htmlFor="upload-input-local">Upload to Local folder</label>
      <input id="upload-input-local" onChange={handleChange} type="file" />
      {progress > 0 && <progress value={progress} max="100" />}
      {isImage(fileUrl) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="uploaded file" src={fileUrl} />
      ) : (
        <code>{fileUrl}</code>
      )}
    </div>
  )
}
