import UploadInputGCP from './upload-input-gcp'
import UploadInputLocal from './upload-input-local'

export default function DemoPage() {
  return (
    <div className="p-2">
      <h1 className="text-lg font-normal">Demo Page</h1>
      <div className="mt-3 space-y-2">
        <UploadInputGCP />
        <UploadInputLocal />
      </div>
    </div>
  )
}
