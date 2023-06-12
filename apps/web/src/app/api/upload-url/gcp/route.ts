import { NextResponse } from 'next/server'
import { Storage } from '@google-cloud/storage'
import { nanoid } from 'nanoid'

const UPLOAD_FOLDER = 'public-tmp'
const BUCKET_NAME = process.env.NEXT_PUBLIC_BUCKET_NAME

export async function GET(request: Request) {
  try {
    if (!BUCKET_NAME) return NextResponse.json({ success: false })

    const { searchParams } = new URL(request.url)
    const id = nanoid()
    const filename = searchParams.get('filename') || ''
    const ext = filename.split('.').pop()

    const storage = new Storage()
    const bucket = storage.bucket(BUCKET_NAME)
    const path = `${UPLOAD_FOLDER}/${id}${ext ? `.${ext}` : ''}`
    const file = bucket.file(path)
    const options = {
      expires: Date.now() + 1 * 60 * 1000, // url expires in 1 minute
    }

    const [response] = await file.generateSignedPostPolicyV4(options)
    const { url, fields } = response

    const data = {
      provider: 'gcp',
      upload_url: url,
      upload_fields: fields,
      file_url: `https://storage.googleapis.com/${BUCKET_NAME}/${path}`,
      file_path: path,
    }

    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message })
  }
}
