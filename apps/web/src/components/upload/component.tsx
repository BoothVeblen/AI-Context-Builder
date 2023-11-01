'use client'

import { ReactNode, useState } from 'react'
import { Download, Eye, Loader2, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

import MicrosoftWordIcon from '../icons/MicrosoftWordIcon'
import PdfIcon from '../icons/PdfIcon'
import { Button } from '../ui/button'
import { Dialog, DialogContent } from '../ui/dialog'
import { Progress } from '../ui/progress'
import { Toggle } from '../ui/toggle'
import { FileItemProps, FileType, UploadFile } from './type'
import { checkShowIcon } from './utils'

interface IconBoxProps {
  children: ReactNode
  className?: string
  onClick?: (e: React.SyntheticEvent) => void
}

interface PreviewProps {
  className?: string
  file: UploadFile
  open: boolean
  setOpen: (s: boolean) => void
  size?: 'sm' | 'lg' | 'xl' | 'default' | 'full' | 'content'
}

export const IconBox = (props: IconBoxProps) => (
  <Button
    variant="outline"
    type="button"
    className={`flex h-8 w-8 items-center justify-center rounded-md border p-0 ${cn(
      props?.className
    )}`}
    onClick={props?.onClick}
  >
    {props?.children}
  </Button>
)

export const PreviewPdf = (props: PreviewProps) => {
  return (
    <div>
      <Sheet open={props?.open} onOpenChange={() => props?.setOpen(false)}>
        <SheetContent className="sm:w-full md:w-[960px]">
          <SheetHeader>
            <SheetTitle>Preview</SheetTitle>
          </SheetHeader>
          <iframe src={props?.file?.url} width="100%" height="100%" />
        </SheetContent>
      </Sheet>
    </div>
  )
}

export const FileImage = ({
  className,
  type,
}: {
  type: FileType
  className?: string
}) => {
  if (type === 'word')
    return <MicrosoftWordIcon className={cn('h-8 w-8 shrink-0', className)} />

  if (type === 'pdf')
    return <PdfIcon className={cn('h-8 w-8 shrink-0', className)} />
}

export const FileCard = (props: FileItemProps) => {
  const { file, listProps, onRemove, className } = props
  const showIcon = checkShowIcon(listProps || false)
  const [open, setOpen] = useState<boolean>(false)
  const preview = (file: UploadFile) => {
    if (props?.onPreview) {
      props?.onPreview(file)
    } else {
      setOpen(true)
    }
  }
  const process = props?.progress as number
  return (
    <div
      className={cn(
        'relative w-full',
        file?.status === 'uploading' ? 'bg-gray-50' : ''
      )}
      key={file?.uid}
    >
      <div
        className={cn(
          'relative z-10 flex h-full w-full rounded-md border p-4',
          file?.status === 'error' ? 'border-red-600' : '',
          className
        )}
      >
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex-b flex w-[90%] items-center gap-2">
            <FileImage type={file?.type as FileType} />
            <div className="flex w-full flex-col gap-1 truncate">
              <div className="truncate">{file?.name}</div>
              {file?.status === 'uploading' && (
                <Progress value={process} className="h-1" />
              )}
            </div>
          </div>
          {showIcon?.show && (
            <div className="flex gap-2">
              {file?.url && (
                <>
                  {showIcon?.showDownloadIcon !== false && (
                    <IconBox onClick={() => props?.onDownload!(file)}>
                      {showIcon?.downloadIcon || (
                        <Download size={16} strokeWidth={3} color="#000" />
                      )}
                    </IconBox>
                  )}
                  {showIcon?.showPreviewIcon !== false && (
                    <IconBox onClick={() => preview(file)}>
                      {showIcon?.previewIcon || (
                        <Eye size={16} strokeWidth={3} />
                      )}
                    </IconBox>
                  )}
                </>
              )}
              <IconBox
                onClick={(e: React.SyntheticEvent) => {
                  e.stopPropagation()
                  e.preventDefault()
                  onRemove?.(file)
                }}
              >
                {showIcon?.removeIcon || <X size={16} strokeWidth={3} />}
              </IconBox>
            </div>
          )}
        </div>
      </div>
      {file?.status === 'error' && (
        <div className="line-clamp-1 bg-red-600">
          {file?.error?.message || props?.locale?.uploadError}
        </div>
      )}
      <PreviewPdf file={file} open={open} setOpen={setOpen} />
    </div>
  )
}

export const ImageCard = (props: FileItemProps) => {
  const { className, file, listProps, onRemove, listType } = props
  const showIcon = checkShowIcon(listProps || false)
  const [open, setOpen] = useState<boolean>(false)
  const preview = (event: React.SyntheticEvent) => {
    event.stopPropagation()
    if (props?.onPreview) {
      props?.onPreview(file)
    } else {
      setOpen(true)
    }
  }
  return (
    <>
      <div
        className={cn(
          'relative h-16 w-16 rounded-lg p-0',
          className,
          file?.status === 'error' && 'border-red-600	',
          file?.status === 'uploading' && 'bg-gray-50 p-1',
          file?.status === 'uploading' && listType === 'image' && 'p-0'
        )}
        key={file?.uid || file?.url}
      >
        <div className="relative flex h-full w-full items-center">
          {file?.status == 'uploading' ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1">
              {props?.locale?.uploading}
              <Loader2 className="h-3 w-3 animate-spin" />
            </div>
          ) : (
            file?.url && (
              <img
                src={file?.url}
                className="aspect-square h-full w-full rounded-md border object-cover"
                alt={file?.name}
              />
            )
          )}
        </div>
        {listProps !== false && (
          <Toggle
            onClick={(e: React.SyntheticEvent) => {
              e.stopPropagation()
              e.preventDefault()
              onRemove?.(file)
            }}
            className={cn(
              'z-1 absolute right-1 top-1 h-6 w-6 rounded-full border p-1',
              file?.status === 'uploading' ? 'bg-white' : 'bg-sky-50'
            )}
          >
            {showIcon?.removeIcon || <X size={18} strokeWidth={3} />}
          </Toggle>
        )}
      </div>
      {file?.status === 'error' && (
        <div className="line-clamp-1 text-red-600">
          {file?.error?.message || props?.locale?.uploadError}
        </div>
      )}
      {listProps && (
        <Dialog open={open} onOpenChange={() => setOpen(false)}>
          <DialogContent className="sm:max-w-[425px]">
            <img
              src={file?.url || ''}
              sizes="(max-width: 500px)"
              width={500}
              height={500}
              alt="preview image"
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
