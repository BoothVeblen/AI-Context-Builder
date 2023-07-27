'use client'

import { RefObject, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon, Loader2Icon, Trash2 } from 'lucide-react'
import useSWRMutation from 'swr/mutation'

import { cn, fetcher } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

import { SectionType } from './setting-page'

interface IProps {
  name: string
  datasetId?: string
  showMore?: boolean
  scrollRef: RefObject<HTMLDivElement>
  activeSection?: number
}

const sections: SectionType[] = [
  {
    title: 'Dataset Name',
    name: 'dataset-name',
  },
  {
    title: 'Document Loaders',
    name: 'loaders',
  },
]
const moreSessions = [
  {
    title: 'Text Splitters',
    name: 'splitters',
  },
  {
    title: 'Text Embedding Models',
    name: 'models',
  },
  {
    title: ' Vector Stores',
    name: 'stores',
  },
]

function deleteDataset(url: string) {
  return fetcher(url, { method: 'DELETE' })
}

const SlideBar = ({
  showMore,
  scrollRef,
  activeSection,
  datasetId,
  name,
}: IProps) => {
  const data = showMore ? [...sections, ...moreSessions] : sections
  const [isPending, startTransition] = useTransition()
  const { trigger, isMutating } = useSWRMutation(
    `/api/datasets/${datasetId}`,
    deleteDataset
  )
  const router = useRouter()
  const handleClick = (name: string) => {
    const element = document.getElementById(`${name}`)
    if (element) {
      scrollRef?.current?.scrollTo({
        top: element.offsetTop,
        left: 0,
        behavior: 'smooth',
      })
    }
  }

  const handelDelete = async () => {
    try {
      const json = await trigger()
      console.log('delete dataset json:', json)
      router.push('/datasets')
      router.refresh()
    } catch (error) {
      console.log('delete dataset error:', error)
    }
  }
  return (
    <div className="h-full w-[276px]">
      <div className="flex w-full items-center space-x-2 px-4 py-3">
        <Button
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => {
            startTransition(() => {
              router.push('/datasets')
            })
          }}
        >
          {isPending ? (
            <Loader2Icon className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowLeftIcon className="h-4 w-4" />
          )}
        </Button>
        <div className="text-lg font-semibold">Back</div>
      </div>
      <div className="mt-4 w-full space-y-2 p-3">
        <div className="text-sm font-medium uppercase text-slate-500">
          DATASETS
        </div>
        <div className="flex flex-col gap-1	text-sm	font-medium">
          {data?.map((item: SectionType, index: number) => (
            <button
              key={item?.title}
              onClick={() => handleClick(item?.name)}
              className={cn(
                'p-3 text-start hover:rounded-md hover:bg-slate-200',
                activeSection === index ? 'rounded-md bg-slate-200' : ''
              )}
            >
              {item?.title}
            </button>
          ))}
        </div>
      </div>
      <div className="m-full h-px bg-slate-100" />
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <div className="w-full p-3">
            <Button variant="ghost" className="w-full justify-between p-3">
              Delete this Dataset
              <Trash2 size={18} />
            </Button>
          </div>
        </AlertDialogTrigger>
        <AlertDialogContent className="w-[512px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Dataset?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete “{name}” Dataset? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isMutating}
              className="bg-red-500 text-white hover:bg-red-500"
              onClick={handelDelete}
            >
              {isMutating ? 'Deleting...' : 'Delete Dataset'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
export default SlideBar
