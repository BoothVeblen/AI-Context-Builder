import React, { useCallback, useMemo } from 'react'
import axios from 'axios'
import { Upload as UploadIcon } from 'lucide-react'
import RcUpload from 'rc-upload'
import type { UploadProps as RcUploadProps } from 'rc-upload'
import useMergedState from 'rc-util/lib/hooks/useMergedState'
import { flushSync } from 'react-dom'

import { cn } from '@/lib/utils'

import { Button } from '../ui/button'
import { Toggle } from '../ui/toggle'
import { ImageFile, PDFFile } from './component'
import { RcFile, UploadChangeParam, UploadFile, UploadProps } from './type'
import {
  file2Obj,
  getFileItem,
  removeFileItem,
  updateFileList,
  uploadFile,
} from './utils'

export const LIST_IGNORE = `__LIST_IGNORE_${Date.now()}__`

const Upload = (props: UploadProps) => {
  const {
    fileList,
    defaultFileList,
    maxCount,
    onChange,
    onRemove,
    onDrop,
    accept,
    action = '',
    multiple = true,
    type = 'select',
    listType = 'pdf',
    showUploadList = true,
    data,
    className,
    disabled: mergedDisabled,
    customRequest,
    handleFiles,
    showFileList = true,
  } = props
  const upload = React.useRef<RcUpload>(null)

  const [mergedFileList, setMergedFileList] = useMergedState(
    defaultFileList || [],
    {
      value: fileList,
      postState: (list: UploadFile[]) => list ?? [],
    }
  )
  const [_, setDragState] = React.useState<string>('drop')
  const [cancelCount, setCancelCount] = React.useState(0)

  // cancel axios request when uploading
  const controller = useMemo(() => new AbortController(), [cancelCount])
  const CancelToken = axios.CancelToken
  const source = CancelToken.source()

  React.useMemo(() => {
    const timestamp = Date.now()

    ;(fileList || []).forEach((file: UploadFile, index: number) => {
      if (!file.uid && !Object.isFrozen(file)) {
        file.uid = `__AUTO__${timestamp}_${index}__`
      }
    })
  }, [fileList])

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
        if (onChange) {
          onChange?.(changeInfo)
        } else {
          // google api for upload
          uploadFile({ source, controller, ...changeInfo, handleFiles })
        }
      })
    },
    [controller, handleFiles, maxCount, onChange, setMergedFileList, source]
  )

  const mergedBeforeUpload = async (file: RcFile, fileListArgs: RcFile[]) => {
    const { beforeUpload } = props

    let parsedFile: File | Blob | string = file
    if (beforeUpload) {
      const result = await beforeUpload(file, fileListArgs)

      if (result === false) {
        return false
      }

      // Hack for LIST_IGNORE, we add additional info to remove from the list
      delete (file as any)[LIST_IGNORE]
      if ((result as any) === LIST_IGNORE) {
        Object.defineProperty(file, LIST_IGNORE, {
          value: true,
          configurable: true,
        })
        return false
      }

      if (typeof result === 'object' && result) {
        parsedFile = result as File
      }
    }

    return parsedFile as RcFile
  }

  const onBatchStart: RcUploadProps['onBatchStart'] = (batchFileInfoList) => {
    // Skip file which marked as `LIST_IGNORE`, these file will not add to file list
    const filteredFileInfoList = batchFileInfoList.filter(
      (info) => !(info.file as any)[LIST_IGNORE]
    )

    // Nothing to do since no file need upload
    if (!filteredFileInfoList.length) {
      return
    }

    const objectFileList = filteredFileInfoList.map((info) =>
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

      if (!filteredFileInfoList[index].parsedFile) {
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
          clone.lastModifiedDate = new Date()
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

  const onSuccess = (response: any, file: RcFile, xhr: any) => {
    try {
      if (typeof response === 'string') {
        response = JSON.parse(response)
      }
    } catch (e) {
      /* do nothing */
    }

    // removed
    if (!getFileItem(file, mergedFileList)) {
      return
    }

    const targetItem = file2Obj(file)
    targetItem.status = 'done'
    targetItem.percent = 100
    targetItem.response = response
    targetItem.xhr = xhr

    const nextFileList = updateFileList(targetItem, mergedFileList)

    onInternalChange(targetItem, nextFileList)
  }

  const onError = (error: Error, response: any, file: RcFile) => {
    // removed
    if (!getFileItem(file, mergedFileList)) {
      return
    }

    const targetItem = file2Obj(file)
    targetItem.error = error
    targetItem.response = response
    targetItem.status = 'error'

    const nextFileList = updateFileList(targetItem, mergedFileList)

    onInternalChange(targetItem, nextFileList)
  }

  const onProgress = (e: { percent: number }, file: RcFile) => {
    // removed
    if (!getFileItem(file, mergedFileList)) {
      return
    }

    const targetItem = file2Obj(file)
    targetItem.status = 'uploading'
    targetItem.percent = e.percent

    const nextFileList = updateFileList(targetItem, mergedFileList)

    onInternalChange(targetItem, nextFileList, e)
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
        source.cancel()
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
          upload.current?.abort(currentFile as RcFile)
          onInternalChange(currentFile, removedFileList)
        } else {
          // 解决上传单张图片移除后展示removed状态的图片问题
          flushSync(() => {
            setMergedFileList([])
          })
        }
      })
    },
    [
      controller,
      mergedFileList,
      onInternalChange,
      onRemove,
      setMergedFileList,
      source,
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
          fileLink.download = `${name}`
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
    onError,
    onProgress,
    onSuccess,
    ...props,
    data,
    multiple,
    action,
    accept,
    disabled: mergedDisabled,
    onChange: undefined,
    customRequest,
    beforeUpload: mergedBeforeUpload,
  } as RcUploadProps

  delete rcUploadProps.className
  delete rcUploadProps.style

  // Remove id to avoid open by label when trigger is hidden
  // !children: https://github.com/ant-design/ant-design/issues/14298
  // disabled: https://github.com/ant-design/ant-design/issues/16478
  //           https://github.com/ant-design/ant-design/issues/24197
  if (!props?.children || mergedDisabled) {
    delete rcUploadProps.id
  }

  const selectDefaultButton = React.useMemo(() => {
    if (listType === 'pdf') {
      return (
        <div className="flex cursor-pointer flex-row rounded-md bg-primary px-4 py-2 text-sm text-white">
          <UploadIcon size={16} strokeWidth={3} />
          <span className="pl-2">Upload File</span>
        </div>
      )
    } else {
      return (
        <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50">
          <UploadIcon size={28} strokeWidth={2} />
        </div>
      )
    }
  }, [listType])
  const defaultButton = React.useMemo(() => {
    // 上传按钮的默认样式
    if (type === 'drag') {
      return (
        <div
          className="
          rounded-md bg-slate-200 p-10 transition delay-150 ease-in-out hover:bg-gray-100 hover:p-12"
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
        showUploadList={showUploadList}
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
    showUploadList,
    rcUploadProps,
    props?.children,
    defaultButton,
    handleRemove,
    showFileList,
  ])
  return (
    <div
      className={cn(
        'flex h-full w-full cursor-pointer flex-col  items-center justify-center',
        listType === 'image' ? 'gap-0' : 'gap-2',
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
          {listType !== 'image' &&
            mergedFileList?.map((file: UploadFile) => {
              return listType === 'pdf' ? (
                <PDFFile
                  {...props}
                  file={file}
                  onDownload={handleDownload}
                  onRemove={handleRemove}
                  showUploadList={showUploadList}
                  key={file?.uid}
                />
              ) : (
                <ImageFile
                  {...props}
                  file={file}
                  onRemove={handleRemove}
                  showUploadList={showUploadList}
                  key={file?.uid}
                />
              )
            })}
        </div>
      )}
    </div>
  )
}

export default Upload
