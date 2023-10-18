import * as React from 'react'
import { Loader2Icon, XIcon } from 'lucide-react'
import useSWR, { useSWRConfig } from 'swr'
import useSWRMutation from 'swr/mutation'

import { fetcher } from '@/lib/utils'
import { SlackTeam } from '@/db/slack_teams/schema'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

function TeamCard({
  icon,
  name,
  url,
  app_id,
  team_id,
}: {
  icon: string
  name: string
  url: string
  app_id: string
  team_id: string
}) {
  const { mutate } = useSWRConfig()
  const { toast } = useToast()

  const { trigger: triggerRemoveTeam, isMutating } = useSWRMutation(
    `/api/slack/remove-team`,
    removeTeam
  )

  const handleRemove = React.useCallback(async () => {
    await triggerRemoveTeam({
      app_id,
      team_id,
    })
    await mutate(`/api/me/slack/teams`)
    toast({ description: 'The workspace has been disconnected' })
  }, [triggerRemoveTeam, app_id, team_id, mutate, toast])

  return (
    <div className="group flex items-center justify-between rounded-md border bg-white p-4">
      <div className="flex items-center gap-4">
        <img alt="slack team icon" src={icon} className="h-10 w-10 rounded" />
        <div className="flex-1 gap-1">
          <p className="text-sm font-medium leading-none">{name}</p>
          <a
            href={url}
            target="_blank"
            className="text-sm text-muted-foreground hover:underline"
          >
            {url}
          </a>
        </div>
      </div>
      <Button
        variant="outline"
        size="icon"
        className="hidden h-8 w-8 rounded-md group-hover:flex"
        onClick={handleRemove}
        disabled={isMutating}
      >
        {isMutating ? (
          <Loader2Icon className="h-4 w-4 animate-spin" />
        ) : (
          <XIcon className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}

function removeTeam(
  url: string,
  {
    arg,
  }: {
    arg: {
      app_id: string
      team_id: string
    }
  }
) {
  return fetcher(url, {
    method: 'POST',
    body: JSON.stringify(arg),
  })
}

export default function SlackTeamList() {
  const { data: teamList = [], isLoading } = useSWR<Partial<SlackTeam>[]>(
    '/api/me/slack/teams',
    fetcher,
    {
      revalidateOnFocus: true,
      keepPreviousData: true,
    }
  )

  if (teamList.length === 0 || isLoading) {
    return null
  }

  return (
    <div className="mt-4 space-y-2">
      {teamList.map(
        ({ app_id, team_id, team_name, team_url, team_icon }: any) => {
          return (
            <TeamCard
              key={`${app_id}-${team_id}`}
              icon={team_icon}
              name={team_name}
              url={team_url}
              app_id={app_id}
              team_id={team_id}
            />
          )
        }
      )}
    </div>
  )
}
