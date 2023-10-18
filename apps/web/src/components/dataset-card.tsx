import Link from 'next/link'
import { Database, FileOutput, Files, FileType2 } from 'lucide-react'

import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

interface IProps {
  id: string
  title: string
  iconType?: string
  fileNum?: number
  totalWords?: number
  linkedAppCount?: number
}

function formateNumber(characters: number) {
  const formatter = new Intl.NumberFormat('en', {
    notation: 'compact',
  })
  return formatter.format(characters)
}

export default function DatasetCard({
  id,
  title,
  fileNum,
  totalWords,
  linkedAppCount,
}: IProps) {
  return (
    <Link href={`/dataset/${id}/settings/documents`}>
      <Card className="flex h-[148px] flex-col px-4 py-6 shadow-none hover:shadow-md">
        <CardHeader className="h-full p-0">
          <CardTitle className="flex flex-1 gap-4 text-lg">
            <Database size={32} className="text-orange-600" />

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
                {formateNumber(totalWords)} words
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
