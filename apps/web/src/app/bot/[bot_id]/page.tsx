import { redirect } from 'next/navigation'

interface IProps {
  params: { bot_id: string }
}

export default function BotPage({ params }: IProps) {
  const { bot_id } = params
  // TODO: use bot_id to fetch the latest chat id
  // if no chat id found, create one

  redirect(`/bot/${bot_id}/chat/c1`)
}
