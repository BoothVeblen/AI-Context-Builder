'use client'

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import SegmentForm from './segment-form'
import { ISegmentEditProps } from './type'

const AddOrEdit = (props: ISegmentEditProps) => {
  return (
    <AlertDialog open={props.open} onOpenChange={props.setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {props.content ? 'Edit' : 'Add'} Segment
          </AlertDialogTitle>
        </AlertDialogHeader>
        <SegmentForm {...props} />
      </AlertDialogContent>
    </AlertDialog>
  )
}
export default AddOrEdit
