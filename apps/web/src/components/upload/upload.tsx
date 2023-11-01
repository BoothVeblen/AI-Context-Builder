import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { pick } from 'lodash'
import RcUpload from 'rc-upload'
import type { UploadProps as RcUploadProps } from 'rc-upload'
import { flushSync } from 'react-dom'

import { cn } from '@/lib/utils'

import { ImageCard } from './component'
import {
  AbortRef,
  BeforeUploadValueType,
  FilePercent,
  ListTypeProps,
  RcFile,
  UploadChangeParam,
  UploadFile,
  UploadProps,
} from './type'
import UploadButton from './upload-button'
import UploadFileList from './upload-file-list'
import { changeToUploadFile, file2Obj, FileProps, uploadFile } from './utils'
import UploadWrapper from './wrapper'

const Upload = (props: UploadProps) => {
  const {
    fileList,
    maxCount,
    onChange,
    accept,
    bgText = '',
    bgColor = 'slate',
    action = '',
    multiple = true,
    type = 'select',
    listType = 'pdf',
    fileType,
    className,
    disabled: mergedDisabled,
    customRequest = () => {},
    onChangeFileList,
    beforeUpload,
    setUploading,
  } = props
  const upload = React.useRef<RcUpload>(null)
  const files = changeToUploadFile(fileList || []) as UploadFile<any>[]
  // check is uploading
  const [isUploading, setIsUploading] = useState(false)
  // record the beforeUpload status, only isValid to fetch the google cloud api
  const [isValid, setIsValid] = useState<
    BeforeUploadValueType | Promise<BeforeUploadValueType>
  >(true)
  const [mergedFileList, setMergedFileList] = useState<UploadFile<any>[]>(files)
  // abort axios request
  const aborts = useRef<AbortRef>([])
  const [process, setProcess] = useState<FilePercent[]>([])

  const unloadCallback = (event: BeforeUnloadEvent) => {
    event.preventDefault()
    event.returnValue = ''
    return ''
  }

  const handleEndConcert = () => {
    aborts?.current?.forEach((item) => item?.control?.abort())
  }

  useEffect(() => {
    setUploading?.(isUploading)
    setIsUploading(isUploading)
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
    async (file: UploadFile, changedFileList: UploadFile[]) => {
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
      setMergedFileList(cloneList)
      const changeInfo: UploadChangeParam<UploadFile> = {
        file: file as UploadFile,
        fileList: cloneList,
      }

      setIsUploading(true)
      // google api for upload
      if (isValid) {
        await uploadFile({
          aborts: aborts,
          setMergedFileList,
          ...changeInfo,
          onChangeFileList,
          setProcess,
        })
      }
      setIsUploading(false)
    },

    [maxCount, isValid, onChangeFileList]
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
      file2Obj(info.file as RcFile, fileType)
    )
    const newFileList = mergedFileList.concat(objectFileList)

    objectFileList.forEach((fileObj) => {
      onInternalChange(fileObj, newFileList)
    })
  }

  const handleRemove = useCallback((file: UploadFile) => {
    setMergedFileList((files: UploadFile<any>[]) => {
      const removedFileList = files?.filter(
        (item: UploadFile) => item?.uid !== file?.uid
      )
      if (removedFileList?.length) {
        // to abort the current axios request
        const current = aborts?.current?.find((item) => item?.uid === file?.uid)
        current?.control?.abort()

        // handle fileList
        const removed = removedFileList?.reduce(
          (m: FileProps[], item: UploadFile) => {
            m.push(pick(item, ['url', 'uid', 'type', 'name']))
            return m
          },
          []
        )
        onChangeFileList?.(removed)
      } else {
        onChangeFileList?.([])
      }
      return removedFileList
    })
  }, [])

  const rcUploadProps = {
    onBatchStart,
    ...props,
    multiple,
    action,
    accept,
    disabled: mergedDisabled,
    onChange,
    customRequest,
    beforeUpload: mergedBeforeUpload,
  } as RcUploadProps

  // Remove id to avoid open by label when trigger is hidden
  if (!props?.children || mergedDisabled) {
    delete rcUploadProps.id
  }

  const showUpdateImageList = useMemo(() => {
    const latest = mergedFileList[mergedFileList?.length - 1]
    return latest?.uid || isUploading ? (
      <ImageCard
        {...props}
        file={{ ...latest }}
        listProps={false}
        key={latest?.uid}
      />
    ) : (
      bgText
    )
  }, [bgText, mergedFileList, isUploading, props])

  const hiddenUploadIcon = useMemo(() => {
    const file = mergedFileList?.find(
      (item: UploadFile) => item?.type === fileType
    )
    return listType === 'update-file' && type === 'drag' && file?.uid
  }, [mergedFileList, listType, type, fileType])
  return (
    <UploadWrapper className={className} listType={listType as ListTypeProps}>
      <div className={cn(hiddenUploadIcon ? 'hidden' : 'block')}>
        <RcUpload {...rcUploadProps} ref={upload}>
          <UploadButton
            bgColor={bgColor}
            listType={listType as ListTypeProps}
            type={type}
            mergedFileList={mergedFileList}
          >
            {showUpdateImageList}
          </UploadButton>
        </RcUpload>
      </div>

      <UploadFileList
        {...props}
        mergedFileList={mergedFileList}
        process={process}
        onRemove={handleRemove}
      />
    </UploadWrapper>
  )
}

export default Upload
