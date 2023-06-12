'use client'

import { ChangeEvent, useState } from 'react'
import axios from 'axios'

import { isImage } from '@/lib/utils'

export default function UploadInputGCP() {
  const [progress, setProgress] = useState(0)
  const [fileUrl, setFileUrl] = useState('')

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.currentTarget.files?.[0]
      if (!file) return

      const filename = encodeURIComponent(file.name)
      const res = await fetch(`/api/upload-url/gcp?filename=${filename}`)
      const { success, data, error } = await res.json()

      if (!success) throw new Error(error)

      const { upload_url, upload_fields, file_url } = data as {
        provider: string
        upload_url: string
        upload_fields: { [key: string]: string }
        file_url: string
        file_path: string
      }

      const formData = new FormData()
      Object.entries({ ...upload_fields, file }).forEach(([key, value]) => {
        formData.append(key, value)
      })

      axios
        .post(upload_url, formData, {
          onUploadProgress: (progressEvent) => {
            console.log('progressEvent:', progressEvent)
            const { progress = 0 } = progressEvent
            setProgress(progress * 100)
          },
        })
        .then(() => {
          console.log('upload success:', file_url)
          setFileUrl(file_url)
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
      <label htmlFor="upload-input-gcp">Upload to Google Cloud</label>
      <input id="upload-input-gcp" onChange={handleChange} type="file" />
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
