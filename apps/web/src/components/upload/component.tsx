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

import { Button } from '../ui/button'
import { Dialog, DialogContent } from '../ui/dialog'
import { Progress } from '../ui/progress'
import { Toggle } from '../ui/toggle'
import { FileItemProps, UploadFile } from './type'
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
        <SheetContent className=" sm:w-full md:w-[960px]">
          <SheetHeader>
            <SheetTitle>Preview</SheetTitle>
          </SheetHeader>
          <iframe src={props?.file?.url} width="100%" height="100%" />
        </SheetContent>
      </Sheet>
    </div>
  )
}

export const PdfImage = ({
  width,
  height,
}: {
  width?: string
  height?: string
}) => (
  <svg
    width={width || '25'}
    height={height || '32'}
    viewBox="0 0 25 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="24.2759" height="32" fill="url(#pattern0)" />
    <defs>
      <pattern
        id="pattern0"
        patternContentUnits="objectBoundingBox"
        width="1"
        height="1"
      >
        <use href="#image0_61_1447" transform="scale(0.0227273 0.0172414)" />
      </pattern>
      <image
        id="image0_61_1447"
        width="44"
        height="58"
        href="data:image/png;base64,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"
      />
    </defs>
  </svg>
)

export const PDFFile = (props: FileItemProps) => {
  const { file, showUploadList, fileNameStyle, onRemove } = props
  const showIcon = checkShowIcon(showUploadList || false)
  const [open, setOpen] = useState<boolean>(false)
  const preview = (file: UploadFile) => {
    if (props?.onPreview) {
      props?.onPreview(file)
    } else {
      setOpen(true)
    }
  }
  return (
    <div
      className={`relative ${file?.status === 'uploading' ? 'bg-gray-50	' : ''}`}
      key={file?.uid}
    >
      <div
        className={`relative z-10 flex h-full w-full rounded-md border py-4 pl-6 pr-4 ${
          file?.status === 'error' ? 'border-[#ff4d4f]' : ''
        }`}
      >
        <div className="flex w-full items-center justify-between">
          <div className={`flex-b flex w-[90%] items-center gap-2 `}>
            <PdfImage />
            <div className="flex w-full flex-col gap-1">
              <div className={`line-clamp-1 ${fileNameStyle}`}>
                {file?.name}
              </div>
              {file?.status === 'uploading' &&
                (props?.progress || (
                  <Progress value={file?.percent || 0} className="h-1" />
                ))}
            </div>
          </div>
          {showIcon?.show && (
            <div className="flex gap-2">
              {(file?.status === 'success' || file?.status === 'done') &&
                file?.url && (
                  <>
                    <IconBox onClick={() => props?.onDownload!(file)}>
                      {showIcon?.downloadIcon || (
                        <Download size={16} strokeWidth={3} color="#000" />
                      )}
                    </IconBox>
                    <IconBox onClick={() => preview(file)}>
                      {showIcon?.previewIcon || (
                        <Eye size={16} strokeWidth={3} />
                      )}
                    </IconBox>
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
        <div className="line-clamp-1 text-[rgb(255,77,79)]">
          {file?.error?.message || props?.locale?.uploadError}
        </div>
      )}
      <PreviewPdf file={file} open={open} setOpen={setOpen} />
    </div>
  )
}

export const ImageFile = (props: FileItemProps) => {
  const { className, file, showUploadList, onRemove } = props
  const showIcon = checkShowIcon(showUploadList || false)
  const [open, setOpen] = useState<boolean>(false)
  const previw = (event: React.SyntheticEvent) => {
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
          'relative z-20 h-20 w-20 rounded-lg border  p-2',
          className,
          file?.status === 'error' ? 'border-[#ff4d4f]' : '',
          file?.status === 'uploading' ? 'bg-gray-50' : ''
        )}
        key={file?.uid || file?.url}
      >
        <div className={`relative z-10 flex h-full w-full items-center`}>
          {file?.status == 'uploading' && !file?.url ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1">
              {props?.locale?.uploading}
              <Loader2 className="h-3 w-3 animate-spin" />
            </div>
          ) : (
            file?.url && (
              <img
                src={file?.url}
                width={72}
                height={72}
                alt={file?.name}
                onClick={(event) => previw(event)}
              />
            )
          )}
        </div>
        {showUploadList !== false && (
          <Toggle
            onClick={(e: React.SyntheticEvent) => {
              e.stopPropagation()
              e.preventDefault()
              onRemove?.(file)
            }}
            className={`z-20 h-6 w-6 rounded-full border  p-1 ${
              file?.status === 'uploading' ? 'bg-white' : 'bg-sky-50'
            } absolute right-1 top-1`}
          >
            {showIcon?.removeIcon || <X size={18} strokeWidth={3} />}
          </Toggle>
        )}
      </div>
      {file?.status === 'error' && (
        <div className="line-clamp-1 text-[rgb(255,77,79)]">
          {file?.error?.message || props?.locale?.uploadError}
        </div>
      )}
      <Dialog open={open} onOpenChange={() => setOpen(false)}>
        <DialogContent className="sm:max-w-[425px]">
          <img
            src={file?.url || ''}
            sizes="(max-width: 500px)"
            width={500}
            height={500}
            alt="oreview image"
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
