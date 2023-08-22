import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Camera, Upload as UploadIcon } from 'lucide-react'
import RcUpload from 'rc-upload'
import type { UploadProps as RcUploadProps } from 'rc-upload'
import { flushSync } from 'react-dom'

import { cn } from '@/lib/utils'

import { Button } from '../ui/button'
import { ImageFile, PDFFile } from './component'
import {
  BeforeUploadValueType,
  FilePercent,
  RcFile,
  UploadChangeParam,
  UploadFile,
  UploadProps,
} from './type'
import {
  changeToUploadFile,
  file2Obj,
  FileProps,
  removeFileItem,
  updateFileList,
  uploadFile,
} from './utils'

export const LIST_IGNORE = `__LIST_IGNORE_${Date.now()}__`

const Upload = (props: UploadProps) => {
  const {
    fileList,
    maxCount,
    onChange,
    onRemove,
    onDrop,
    accept,
    bgText = '',
    bgColor = 'slate',
    action = '',
    multiple = true,
    type = 'select',
    listType = 'pdf',
    listProps = true,
    fileType,
    data,
    className,
    disabled: mergedDisabled,
    customRequest = () => {},
    onChangeFileList,
    beforeUpload,
    setUploading,
    showFileList = true,
  } = props
  const upload = React.useRef<RcUpload>(null)
  const files = changeToUploadFile(fileList || [])
  // check is uploading
  const [isUploading, setIsUploading] = useState(false)
  // record the beforeUpload status, only isValid to fetch the google cloud api
  const [isValid, setIsValid] = useState<
    BeforeUploadValueType | Promise<BeforeUploadValueType>
  >(true)
  const [mergedFileList, setMergedFileList] = useState<UploadFile<any>[]>(files)
  const [_, setDragState] = React.useState<string>('drop')
  const [cancelCount, setCancelCount] = React.useState(0)
  const [process, setProcess] = useState<FilePercent[]>([])
  // cancel axios request when uploading
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const controller = useMemo(() => new AbortController(), [cancelCount])

  const unloadCallback = (event: BeforeUnloadEvent) => {
    event.preventDefault()
    event.returnValue = ''
    return ''
  }

  const handleEndConcert = () => controller.abort()

  useEffect(() => {
    setUploading?.(isUploading)
  }, [isUploading, setUploading])

  // browner close to conform when uploading
  useEffect(() => {
    if (isUploading) {
      window.addEventListener('beforeunload', unloadCallback)
      window.addEventListener('unload', handleEndConcert)
    }
    return () => {
      window.removeEventListener('beforeunload', unloadCallback)
      window.removeEventListener('unload', handleEndConcert)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUploading])

  const onInternalChange = useCallback(
    (
      file: UploadFile,
      changedFileList: UploadFile[],
      event?: { percent: number }
    ) => {
      let cloneList = [...changedFileList]
      // Cut to match count
      if (maxCount === 1) {
        cloneList = cloneList.slice(-1)
      } else if (maxCount) {
        cloneList = cloneList.slice(0, maxCount)
      }
      // Prevent React18 auto batch since input[upload] trigger process at same time
      // which makes fileList closure problem
      flushSync(() => {
        setMergedFileList(cloneList)
      })
      const changeInfo: UploadChangeParam<UploadFile> = {
        file: file as UploadFile,
        fileList: cloneList,
      }

      if (event) {
        changeInfo.event = event
      }
      flushSync(() => {
        // google api for upload
        if (isValid !== false && changeInfo?.file?.status !== 'removed') {
          uploadFile({
            controller,
            file: changeInfo?.file,
            mergedFileList: changeInfo?.fileList,
            onChangeFileList,
            setIsUploading,
            fileType,
          })
        }
      })
    },

    [maxCount, isValid, controller, onChangeFileList, fileType]
  )

  const mergedBeforeUpload = async (file: RcFile, fileListArgs: RcFile[]) => {
    let parsedFile: File | Blob | string = file
    if (beforeUpload) {
      const result = await beforeUpload(file, fileListArgs)
      setIsValid(result)
      if (result === false) {
        return false
      }
    }

    return parsedFile as RcFile
  }

  const onBatchStart: RcUploadProps['onBatchStart'] = (batchFileInfoList) => {
    const objectFileList = batchFileInfoList.map((info) =>
      file2Obj(info.file as RcFile)
    )
    // Concat new files with prev files
    let newFileList = [...mergedFileList]

    objectFileList.forEach((fileObj) => {
      // Replace file if exist
      newFileList = updateFileList(fileObj, newFileList)
    })

    objectFileList.forEach((fileObj, index) => {
      // Repeat trigger `onChange` event for compatible
      let triggerFileObj: UploadFile = fileObj

      if (!batchFileInfoList[index].parsedFile) {
        // `beforeUpload` return false
        const { originFileObj } = fileObj
        let clone
        try {
          clone = new File([originFileObj], originFileObj.name, {
            type: originFileObj.type,
          }) as any as UploadFile
        } catch (e) {
          clone = new Blob([originFileObj], {
            type: originFileObj.type,
          }) as any as UploadFile
          clone.name = originFileObj.name
          clone.lastModified = new Date().getTime()
        }
        clone.uid = fileObj.uid
        triggerFileObj = clone
      } else {
        // Inject `uploading` status
        fileObj.status = 'uploading'
      }
      onInternalChange(triggerFileObj, newFileList)
    })
  }

  const handleRemove = useCallback(
    (file: UploadFile) => {
      let currentFile: UploadFile
      Promise.resolve(
        typeof onRemove === 'function' ? onRemove(file) : onRemove
      ).then((ret) => {
        // Prevent removing file
        if (ret === false) {
          return
        }
        controller.abort()
        setCancelCount((c) => c + 1)

        const removedFileList = removeFileItem(file, mergedFileList)
        if (removedFileList?.length) {
          currentFile = { ...file, status: 'removed' }
          mergedFileList?.forEach((item: UploadFile) => {
            const matchKey = currentFile.uid !== undefined ? 'uid' : 'name'
            if (
              item[matchKey] === currentFile[matchKey] &&
              !Object.isFrozen(item)
            ) {
              item.status = 'removed'
            }
          })
          // handle fileList
          const removed = removedFileList?.reduce(
            (m: FileProps[], item: UploadFile) => {
              m.push({
                url: item?.url || '',
                name: item?.name,
                uid: item?.uid,
                type: fileType || item?.type,
              })
              return m
            },
            []
          )
          onChangeFileList?.(removed)
          onInternalChange(currentFile, removedFileList)
        } else {
          // 解决上传单张图片移除后展示removed状态的图片问题
          flushSync(() => {
            setMergedFileList([])
            onChangeFileList?.([])
          })
        }
      })
    },
    [
      onRemove,
      controller,
      mergedFileList,
      onChangeFileList,
      onInternalChange,
      fileType,
    ]
  )

  const onFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    setDragState(e.type)
    if (e.type === 'drop') {
      onDrop?.(e)
    }
  }

  const handleDownload = (file: UploadFile) => {
    if (props?.onDownload) {
      props?.onDownload(file)
    } else {
      fetch(`${file?.url}`, {
        method: 'GET',
      })
        .then((response) => response.blob())
        .then((blob) => {
          const url = window.URL.createObjectURL(blob)
          const fileLink = document.createElement('a')
          fileLink.href = url
          fileLink.download = `${file?.name}`
          document.body.appendChild(fileLink)
          fileLink.click()
          fileLink.remove()
        })
        .catch(console.error)
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const rcUploadProps = {
    onBatchStart,
    ...props,
    data,
    multiple,
    action,
    accept,
    disabled: mergedDisabled,
    onChange,
    customRequest,
    beforeUpload: mergedBeforeUpload,
  } as RcUploadProps

  delete rcUploadProps.className
  delete rcUploadProps.style

  // Remove id to avoid open by label when trigger is hidden
  if (!props?.children || mergedDisabled) {
    delete rcUploadProps.id
  }

  const showUpdateImageList = useMemo(() => {
    const latest = mergedFileList[mergedFileList?.length - 1]
    return mergedFileList?.length !== 0 ? (
      <ImageFile {...props} file={latest} listProps={false} key={latest?.uid} />
    ) : (
      bgText
    )
  }, [bgText, mergedFileList, props])

  const selectDefaultButton = React.useMemo(() => {
    if (listType === 'pdf') {
      return (
        <Button type="button">
          <UploadIcon size={16} strokeWidth={3} />
          <span className="pl-2">Upload File</span>
        </Button>
      )
    }
    if (listType === 'update-image') {
      return (
        <Button
          type="button"
          variant="outline"
          disabled={isUploading}
          className={cn(
            'relative z-10 flex h-16 w-16 items-center justify-center rounded-lg border p-0',
            mergedFileList?.length === 0
              ? `bg-${bgColor}-600 text-white`
              : 'border-none',
            `hover:${bgColor ? `bg-${bgColor}-600` : 'bg-white'}`,
            'hover:text-white'
          )}
        >
          {showUpdateImageList}
          <div className="z-1 absolute bottom-[-8px] right-[-8px] flex h-6 w-6  items-center justify-center rounded-full border bg-white text-black">
            <Camera size={16} strokeWidth={2} />
          </div>
        </Button>
      )
    } else {
      return (
        <Button
          type="button"
          variant="outline"
          className="z-1 h-16 w-16 bg-slate-50 "
        >
          <Camera size={28} />
        </Button>
      )
    }
  }, [bgColor, isUploading, listType, mergedFileList, showUpdateImageList])
  const defaultButton = React.useMemo(() => {
    // 上传按钮的默认样式
    if (type === 'drag') {
      return (
        <div
          className="
         rounded-md border p-10 transition delay-150 ease-in-out hover:shadow-md"
        >
          Upload Files
          <div>
            Drag and drop your PDF here or <span>Browse.</span>
          </div>
        </div>
      )
    }
    return selectDefaultButton
  }, [selectDefaultButton, type])

  const showUploadIcon = React.useMemo(() => {
    const file = mergedFileList?.[0]
    const showImage = listType === 'image' && mergedFileList?.length !== 0
    return showImage && showFileList ? (
      <ImageFile
        key={file?.url || file?.uid}
        file={file}
        onRemove={handleRemove}
        className={cn('h-16 w-16', className)}
        listProps={listProps}
      />
    ) : (
      <RcUpload {...rcUploadProps} ref={upload}>
        {props?.children || defaultButton}
      </RcUpload>
    )
  }, [
    mergedFileList,
    listType,
    className,
    listProps,
    rcUploadProps,
    props?.children,
    defaultButton,
    handleRemove,
    showFileList,
  ])
  return (
    <div>
      <div
        className={cn(
          'flex  cursor-pointer flex-col  items-start justify-start',
          listType === 'image' ? 'gap-0' : 'gap-2',
          listType === 'pdf' ? 'h-full w-full' : 'h-16 w-16',
          className
        )}
        onClick={onFileDrop}
      >
        {showUploadIcon}
        {showFileList && (
          <div
            className={cn(
              'flex w-full gap-2',
              listType === 'images-list' ? 'flex-row flex-wrap' : 'flex-col'
            )}
          >
            {(listType === 'pdf' || listType === 'images-list') &&
              mergedFileList?.map((file: UploadFile) => {
                const percent = process?.filter(
                  (item) => item?.uid === file?.uid
                )?.[0]?.percent
                return listType === 'pdf' ? (
                  <PDFFile
                    {...props}
                    file={file}
                    onDownload={handleDownload}
                    onRemove={handleRemove}
                    listProps={listProps}
                    key={file?.uid}
                    progress={percent}
                  />
                ) : (
                  <ImageFile
                    {...props}
                    file={file}
                    onRemove={handleRemove}
                    listProps={listProps}
                    key={file?.uid}
                  />
                )
              })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Upload
