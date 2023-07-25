'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeftIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PdfImage } from '@/components/upload/component'

interface IProps {
  name: string
  config: Record<string, any>
}

export default function DatasetViewer({ name, config }: IProps) {
  const router = useRouter()

  function handleGoBack() {
    router.back()
  }
  return (
    <div className="relative block lg:hidden">
      <div className="sticky top-0 flex h-12 items-center gap-x-6 border-b border-slate-100 bg-white px-4">
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

      <div className="space-y-8 p-8">
        <Title>Dataset Name</Title>
        <Item label="Dataset Name" value={name} />
        <div className="h-px bg-slate-100" />
        <Title>Document Loaders</Title>
        <Item label="Type" value={config.loaderType} />
        <Item label="Files" value={config.files} type="files" />
        <div className="h-px bg-slate-100" />
        <Title>Text Splitters</Title>
        <Item label="Type" value={config.splitType} />
        <Item label="Chunk size" value={config.chunkSize} />
        <Item label="Chunk overlap" value={config.chunkOverlap} />
        <div className="h-px bg-slate-100" />
        <Title>Text Embedding Models</Title>
        <Item label="Type" value={config.embeddingType} />
        <Item label="Azure OpenAI Api Key" value={config.apiKey} />
        <Item
          label="Azure OpenAI Api Instance Name"
          value={config.instanceName}
        />
        <Item
          label="Azure OpenAI Api Deployment Name"
          value={config.developmentName}
        />
        <Item label="Azure OpenAI Api Version" value={config.apiVersion} />
        <div className="h-px bg-slate-100" />
        <Title>Vector Stores</Title>
        <Item label="Type" value={config.storeType} />
        <Item label="Collection Name" value={config.collectionName} />
        <Item label="Chroma URL" value={config.chromaUrl} />
      </div>
    </div>
  )
}

function Title({ children }: { children: React.ReactNode }) {
  return <div className="text-lg font-semibold">{children}</div>
}

function Item({
  label,
  value,
  type,
}: {
  label: string
  value: string | any[]
  type?: string
}) {
  if (type === 'files' && Array.isArray(value)) {
    return (
      <div className="space-y-2">
        {value.map(({ name, url }: { name: string; url: string }) => (
          <File key={url} name={name} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="text-base font-medium">{label}</div>
      <div className="text-sm">{value || '-'}</div>
    </div>
  )
}

function File({ name }: { name: string }) {
  return (
    <div className="flex h-16 max-w-sm items-center space-x-2 rounded-lg border border-slate-200 px-6">
      <div className="shrink-0">
        <PdfImage id="mobile" />
      </div>
      <div className="truncate text-sm font-medium">{name}</div>
    </div>
  )
}
