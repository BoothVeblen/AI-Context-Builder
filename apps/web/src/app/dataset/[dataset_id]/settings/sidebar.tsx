'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash } from 'lucide-react'
import useSWRMutation from 'swr/mutation'

import { fetcher } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import ConfirmDialog from '@/components/confirm-dialog'

import BaseSideBar from '../../../(app)/app/[app_id]/(manage)/sidebar'

interface IProps {
  name: string
  datasetId?: string
}

function deleteDataset(url: string) {
  return fetcher(url, { method: 'DELETE' })
}

const Sidebar = ({ datasetId, name }: IProps) => {
  const [open, setOpen] = useState(false)
  const { trigger, isMutating } = useSWRMutation(
    `/api/datasets/${datasetId}`,
    deleteDataset
  )
  const router = useRouter()

  const handelDelete = async () => {
    try {
      await trigger()
      router.push('/datasets')
      router.refresh()
    } catch (error) {}
  }
  const nextUrl = 'nextUrl=/datasets'
  return (
    <BaseSideBar>
      <div className="pl-3 text-sm font-medium uppercase text-slate-500">
        Datasets
      </div>

      <BaseSideBar.Link
        href={{
          pathname: `/dataset/${datasetId}/settings/basics`,
          search: nextUrl,
        }}
        name="Basics"
        desc=""
      />
      <BaseSideBar.Link
        href={{
          pathname: `/dataset/${datasetId}/settings/documents`,
          search: nextUrl,
        }}
        name="Data"
        desc=""
      />

      <div className="mb-2 shrink-0 px-3">
        <div className="h-px bg-slate-200" />
      </div>

      <Button
        variant="ghost"
        size="lg"
        className="flex w-full items-center justify-between p-3 hover:bg-slate-200"
        onClick={() => setOpen(true)}
      >
        <span>Delete this Dataset</span>
        <Trash size={18} />
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Delete “${name}” Dataset?`}
        description={` Are you sure you want to delete "${name}” Dataset? This action
        cannot be undone.`}
        confirmText="Delete Dataset"
        loadingText="Deleting..."
        handleConfirm={handelDelete}
        isLoading={isMutating}
      />
    </BaseSideBar>
  )
}
export default Sidebar
