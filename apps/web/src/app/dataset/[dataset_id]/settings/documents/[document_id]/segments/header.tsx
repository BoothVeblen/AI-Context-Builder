import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2Icon, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { LoaderTypeProps } from '@/app/dataset/type'

import FileIcon from '../../file-icon'

interface IProps {
  uid: string
  datasetId: string
  short_id?: string
  icon?: string
  name?: string
  type?: string
  addNew?: () => void
}

const SegmentHeader = ({
  uid,
  addNew,
  short_id = '',
  icon,
  datasetId,
  name = '',
  type = 'pdf',
}: IProps) => {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const goBack = () => {
    const nextUrl = '/datasets'
    startTransition(() => {
      router.push(`/dataset/${datasetId}/settings/documents?nextUrl=${nextUrl}`)
    })
  }
  return (
    <div className="flex w-full justify-between pl-14 pr-8">
      <div className="flex flex-1 items-center gap-2">
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8 shrink-0 p-0"
          onClick={goBack}
          type="button"
          disabled={isPending}
        >
          {isPending ? (
            <Loader2Icon className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowLeft size={18} />
          )}
        </Button>
        <FileIcon
          className="h-6 w-6"
          data={{ name, uid, type, short_id, icon }}
          isSegment
        />
      </div>
      <Button onClick={addNew} type="button" className="flex gap-1">
        <Plus size={16} />
        Add Segment
      </Button>
    </div>
  )
}
export default SegmentHeader
