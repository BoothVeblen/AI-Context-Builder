import { Item, Title } from './view-item'

interface IProps {
  name: string
  config: Record<string, any>
}

const Basics = ({ name, config }: IProps) => {
  return (
    <div className="space-y-8 p-8">
      <Title>Dataset Name</Title>
      <Item label="Dataset Name" value={name} />
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
  )
}

export default Basics
