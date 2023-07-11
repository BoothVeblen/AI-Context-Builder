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

interface IProps {
  name: string
}

const ChatHeader = ({ name }: IProps) => {
  return (
    <div className="hidden w-full border-b border-slate-100 lg:block">
      <div className="flex w-full items-center justify-between px-6 py-3">
        <h2 className="font-medium">{name}</h2>
        <div className="flex"></div>
      </div>
    </div>
  )
}

export default ChatHeader
