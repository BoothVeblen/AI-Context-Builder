import { MutableRefObject } from 'react'
import { Trash } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PreviewCard } from '@/app/dataset/[dataset_id]/document/[document_id]/preview'
import { SegmentProps } from '@/app/dataset/type'

import { formateIndex } from '../../../../../utils'

interface IProps {
  segments: SegmentProps[]
  setOpen: (s: boolean) => void
  setShowDeleteAlter: (s: boolean) => void
  current: MutableRefObject<SegmentProps | null>
}
const SegmentList = ({
  segments,
  setOpen,
  setShowDeleteAlter,
  current,
}: IProps) => {
  return segments?.map((item: SegmentProps, index: number) => {
    const segment_id = item?.segment_id
    const segment_ids = segment_id?.split('-')
    const len = segment_ids?.length || 0
    const segment_number = parseInt(segment_ids?.[len - 1] || '0')
    return (
      <div
        key={index}
        className="group/card relative h-[182px] cursor-pointer"
        onClick={(e) => {
          setOpen(true)
          e.preventDefault()
          current.current = item
        }}
      >
        <PreviewCard
          index={formateIndex(segment_number + 1)}
          content={item?.content}
        />
        <Button
          type="button"
          className="invisible absolute bottom-4 right-4 flex h-8 w-8 gap-2 text-red-600 group-hover/card:visible"
          size="icon"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation()
            setShowDeleteAlter(true)
            current.current = item
          }}
        >
          <Trash size={18} />
        </Button>
      </div>
    )
  })
}

export default SegmentList
