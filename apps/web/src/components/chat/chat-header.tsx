import { Button } from '../ui/button'

interface IconBoxProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export const IconBox = (props: IconBoxProps) => (
  <Button
    variant="outline"
    className={`flex h-8 w-8 items-center justify-center rounded-md border p-0 ${props?.className}`}
    onClick={props?.onClick}
  >
    {props?.children}
  </Button>
)

const ChatHeader = () => {
  return (
    <div className=" w-full border-b border-slate-100 ">
      <div className="flex w-full items-center justify-between px-8 py-3">
        <div className="flex">chat 1</div>
        <div className="flex"></div>
      </div>
    </div>
  )
}

export default ChatHeader
