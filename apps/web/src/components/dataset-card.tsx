import Link from 'next/link'
import { FileOutput, Files, FileType2 } from 'lucide-react'

import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

import { PdfImage } from './upload/component'

interface IProps {
  id: string
  title: string
  iconType?: string
  fileNum?: number
  totalWords?: number
  linkedAppCount?: number
}

export default function DatasetCard({
  id,
  title,
  iconType,
  fileNum,
  totalWords,
  linkedAppCount,
}: IProps) {
  return (
    <Link href={`/dataset/${id}`}>
      <Card className="flex h-[148px] flex-col px-4 py-6 shadow-none hover:shadow-md">
        <CardHeader className="h-full p-0">
          <CardTitle className="flex flex-1 gap-4 text-lg">
            {iconType?.includes('pdf') && <PdfImage />}
            <div className="line-clamp-2 max-h-[52px] flex-1">{title}</div>
          </CardTitle>
          <CardFooter className="flex h-5 w-full gap-3 p-0">
            {fileNum != null && (
              <div className="flex text-xs font-medium text-slate-500">
                <Files size={18} className="mr-1" />
                {fileNum} docs
              </div>
            )}
            {totalWords != null && (
              <div className="flex text-xs font-medium text-slate-500">
                <FileType2 size={18} className="mr-1" />
                {totalWords} words
              </div>
            )}
            {linkedAppCount != null && (
              <div className="flex text-xs font-medium text-slate-500">
                <FileOutput size={18} className="mr-1" />
                {linkedAppCount} linked apps
              </div>
            )}
          </CardFooter>
        </CardHeader>
      </Card>
    </Link>
  )
}
