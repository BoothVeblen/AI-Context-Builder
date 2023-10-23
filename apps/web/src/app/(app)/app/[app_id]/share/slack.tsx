import * as React from 'react'
import { useModal } from '@ebay/nice-modal-react'
import useSWR, { useSWRConfig } from 'swr'
import useSWRMutation from 'swr/mutation'

import { fetcher } from '@/lib/utils'
import { SlackTeamApp } from '@/db/slack_team_apps/schema'
import { SlackTeam } from '@/db/slack_teams/schema'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import SettingsDialog from '@/components/settings/dialog'

function TeamCard({
  icon,
  name,
  url,
  checked,
  onCheckedChange,
}: {
  icon: string
  name: string
  url: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex w-[408px] items-center gap-4 rounded-md border p-4">
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
      <Switch defaultChecked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

function linkTeamToApp(
  url: string,
  {
    arg,
  }: {
    arg: {
      app_id: string
      team_id: string
      context_app_id: string
      unlink?: boolean
    }
  }
) {
  return fetcher(url, {
    method: 'POST',
    body: JSON.stringify(arg),
  })
}

interface IProps {
  context_app_id: string
}

export default function Slack({ context_app_id }: IProps) {
  const { mutate } = useSWRConfig()
  const { toast } = useToast()

  const { data: teamList = [], isLoading: isLoadingTeamList } = useSWR<
    Partial<SlackTeam>[]
  >('/api/me/slack/teams', fetcher, {
    revalidateOnFocus: true,
    keepPreviousData: true,
  })

  const { data: linkedTeamList = [], isLoading: isLoadingLinkedTeamList } =
    useSWR<Partial<SlackTeamApp>[]>(
      `/api/slack/linked-teams/${context_app_id}`,
      fetcher,
      {
        revalidateOnFocus: true,
        keepPreviousData: true,
      }
    )

  const { trigger: triggerLinkTeamToApp } = useSWRMutation(
    `/api/slack/link-team-to-app`,
    linkTeamToApp
  )

  const checkIsLinked = React.useCallback(
    (app_id: string, team_id: string) =>
      linkedTeamList.some(
        (linkedTeam) =>
          linkedTeam.app_id === app_id && linkedTeam.team_id === team_id
      ),
    [linkedTeamList]
  )

  const checkedChangeHandler = React.useCallback(
    (app_id: string, team_id: string, context_app_id: string) =>
      async (checked: boolean) => {
        await triggerLinkTeamToApp({
          app_id,
          team_id,
          context_app_id,
          unlink: !checked,
        })
        toast({
          description: `The workspace has been ${
            checked ? 'enabled' : 'disabled'
          }.`,
        })
        await mutate(`/api/slack/linked-teams/${context_app_id}`)
      },
    [triggerLinkTeamToApp, mutate, toast]
  )

  const modal = useModal(SettingsDialog)

  const handleEditConnection = React.useCallback(() => {
    modal.show({ defaultTab: 'chat-apps' })
  }, [modal])

  const isLoading = isLoadingTeamList || isLoadingLinkedTeamList

  if (isLoading) {
    return null
  }

  if (teamList.length === 0) {
    return (
      <div className="rounded-lg bg-slate-50 px-6 py-8">
        <p className="text-xl font-semibold">Slack is not connected</p>
        <p className="mt-2 text-sm font-medium text-slate-500">
          You need to connect to Slack before sharing your app.
        </p>
        <Button className="mt-6" onClick={handleEditConnection}>
          Go to connect
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="space-y-2">
        {teamList.map(
          ({ app_id, team_id, team_name, team_url, team_icon }: any) => {
            const checked = checkIsLinked(app_id, team_id)
            return (
              <TeamCard
                key={`${app_id}-${team_id}-${
                  checked ? 'checked' : 'unchecked'
                }`}
                icon={team_icon}
                name={team_name}
                url={team_url}
                checked={checked}
                onCheckedChange={checkedChangeHandler(
                  app_id,
                  team_id,
                  context_app_id
                )}
              />
            )
          }
        )}
      </div>
      <div className="mt-2">
        <Button variant="outline" onClick={handleEditConnection}>
          Edit Connections
        </Button>
      </div>
    </div>
  )
}
