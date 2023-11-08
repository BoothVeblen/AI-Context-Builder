export interface ISegmentDeleteProps {
  dataset_id: string
  uid: string
  segment_id: string
  handelRefresh: () => void
}

export interface ISegmentEditProps {
  content: string
  segment_id: string
  dataset_id: string
  document_id: string
  handelRefresh: (s: void) => void
}
