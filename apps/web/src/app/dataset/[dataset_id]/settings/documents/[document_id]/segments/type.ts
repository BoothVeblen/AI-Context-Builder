export interface ISegmentDeleteProps {
  dataset_id: string
  uid: string
  segment_id: string
  showDeleteAlter: boolean
  setShowDeleteAlter: (s: boolean) => void
  handelConfirm: () => void
}

export interface ISegmentEditProps {
  content: string
  segment_id: string
  dataset_id: string
  document_id: string
  open: boolean
  setOpen: (s: boolean) => void
  handelConfirm: (s: void) => void
}
