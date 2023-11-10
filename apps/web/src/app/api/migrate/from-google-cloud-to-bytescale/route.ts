import { NextRequest, NextResponse } from 'next/server'
import * as Bytescale from '@bytescale/sdk'
import { desc, eq, ne } from 'drizzle-orm'
import pLimit from 'p-limit'

import { db } from '@/lib/drizzle-edge'
import { AppsTable } from '@/db/apps/schema'
import { DocumentsTable } from '@/db/documents/schema'

const limit = pLimit(5)

const accountId = process.env.NEXT_PUBLIC_BYTESCALE_PUBLIC_ACCOUNT_ID
const uploadApi = new Bytescale.UploadApi({
  apiKey: process.env.BYTESCALE_SECRET_API_KEY || 'free',
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const secret = searchParams.get('secret')
    if (secret == null || secret !== process.env.SECRET) {
      return NextResponse.json({ success: true })
    }

    const apps = await db
      .select()
      .from(AppsTable)
      .where(ne(AppsTable.icon, ''))
      .orderBy(desc(AppsTable.created_at))
      .limit(1)
    const filteredApps = apps.filter(
      (a) => !!a.icon && a.icon.startsWith('https://storage.googleapis.com/')
    )
    const newApps: any[] = []

    const docs = await db
      .select()
      .from(DocumentsTable)
      .where(ne(DocumentsTable.url, ''))
      .orderBy(desc(DocumentsTable.created_at))
      .limit(1)
    const filteredDocs = docs.filter(
      (d) => !!d.url && d.url.startsWith('https://storage.googleapis.com/')
    )
    const newDocs: any[] = []

    const queue = []

    for (const app of filteredApps) {
      const { short_id, icon } = app
      if (icon && accountId) {
        queue.push(
          limit(async () => {
            try {
              console.log('app upload:', short_id, icon)
              const result = await uploadApi.uploadFromUrl({
                accountId,
                uploadFromUrlRequest: { url: icon },
              })
              const newUrl = result.fileUrl
              console.log('new app:', short_id, newUrl)
              newApps.push({ short_id, icon: newUrl })
              return db
                .update(AppsTable)
                .set({ icon: newUrl })
                .where(eq(AppsTable.short_id, short_id))
            } catch (error) {
              console.error('app upload error:', short_id, error)
              return Promise.resolve()
            }
          })
        )
      }
    }

    for (const doc of filteredDocs) {
      const { short_id, url } = doc
      if (url && accountId) {
        queue.push(
          limit(async () => {
            try {
              console.log('doc upload:', short_id, url)
              const result = await uploadApi.uploadFromUrl({
                accountId,
                uploadFromUrlRequest: { url },
              })
              const newUrl = result.fileUrl
              console.log('new doc:', short_id, newUrl)
              newDocs.push({ short_id, url: newUrl })
              return db
                .update(DocumentsTable)
                .set({ url: newUrl })
                .where(eq(DocumentsTable.short_id, short_id))
            } catch (error) {
              console.error('doc upload error:', short_id, error)
              return Promise.resolve()
            }
          })
        )
      }
    }

    await Promise.allSettled(queue)

    const data = {
      apps,
      filteredApps,
      newApps,
      docs,
      filteredDocs,
      newDocs,
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
