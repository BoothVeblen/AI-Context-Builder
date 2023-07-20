import ChatDebug from '@/components/chat-debug'

const ChatDebugPage = () => {
  const values = {
    sessionId: '',
    sessionName: '1',
    appName: '222',
    appIcon:
      'https://backend.withcontext.ai/backend/upload/2023/04/65947928-68d6-4f64-99d9-0b98578fe4c6.jpeg',
    appId: '11',
  }
  return (
    <div className="p-6">
      <ChatDebug {...values} />
    </div>
  )
}

export default ChatDebugPage
