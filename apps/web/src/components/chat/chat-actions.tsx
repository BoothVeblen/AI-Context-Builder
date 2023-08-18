import { type PropsWithChildren } from 'react'

const ChatActions = ({ children }: PropsWithChildren) => {
  return <div className="absolute -right-4 -top-4 flex">{children}</div>
}

export default ChatActions
