'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeftIcon } from 'lucide-react'

import { NewDocument } from '@/db/documents/schema'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import Basics from './basics'
import Documents from './documents'

interface IProps {
  name: string
  config: any
  files?: NewDocument[]
}

const ViewPage = (props: IProps) => {
  const router = useRouter()

  function handleGoBack() {
    router.push('/datasets')
  }
  return (
    <div className="flex h-full w-full flex-col overflow-y-auto lg:hidden">
      <div className="flex h-12 items-center gap-x-6 border-b border-slate-200 bg-white px-4">
        <Button
          variant="ghost"
          size="icon"
          className="-m-2.5"
          onClick={handleGoBack}
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </Button>
        <h1 className="text-sm font-medium">Dataset</h1>
      </div>
      <div className=" w-full flex-1 overflow-hidden">
        <Tabs defaultValue="data" className="h-full w-full overflow-hidden">
          <TabsList className="mx-6 mt-6">
            <TabsTrigger value="basics">Basics</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>
          <TabsContent value="basics">
            <Basics {...props} />
          </TabsContent>
          <TabsContent value="data" className="h-full">
            <Documents documents={props?.files || []} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default ViewPage
