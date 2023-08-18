import { fetcher } from '@/lib/utils'
import { ChatFeedbackRequest } from '@/app/api/chat/feedback/route'

export default function submitFeedback(
  url: string,
  {
    arg,
  }: {
    arg: ChatFeedbackRequest
  }
) {
  fetcher(url, {
    method: 'POST',
    body: JSON.stringify(arg),
  })
}
