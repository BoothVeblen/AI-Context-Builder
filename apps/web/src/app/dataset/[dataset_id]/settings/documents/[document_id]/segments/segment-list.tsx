import { useModal } from '@ebay/nice-modal-react'

import { PreviewCard } from '@/app/dataset/[dataset_id]/document/[document_id]/preview'
import { SegmentProps } from '@/app/dataset/type'

import { formateIndex } from '../../../../../utils'
import DeleteSegment from './delete-segment'
import SegmentFormDialog from './segment-form-dialog'

interface IProps {
  segments: SegmentProps[]
  datasetId: string
  uid: string
  handelRefresh: () => void
}
const SegmentList = ({ segments, datasetId, uid, handelRefresh }: IProps) => {
  const modal = useModal(SegmentFormDialog)
  const handleClick = (segment_id: string, content: string) => {
    modal.show({
      segment_id,
      content,
      dataset_id: datasetId,
      document_id: uid,
      handelRefresh,
    })
  }
  return segments?.map((item: SegmentProps, index: number) => {
    const segment_id = item?.segment_id || ''
    const segment_ids = segment_id?.split('-')
    const len = segment_ids?.length || 0
    const segment_number = parseInt(segment_ids?.[len - 1] || '0')

    return (
      <div
        key={index}
        className="group/card relative h-[182px] cursor-pointer"
        onClick={(e) => {
          e.preventDefault()
          handleClick(segment_id, item?.content)
        }}
      >
        <PreviewCard
          index={formateIndex(segment_number + 1)}
          content={item?.content}
        />
        <DeleteSegment
          dataset_id={datasetId}
          segment_id={segment_id}
          uid={uid}
          handelRefresh={handelRefresh}
        />
      </div>
    )
  })
}

export default SegmentList
