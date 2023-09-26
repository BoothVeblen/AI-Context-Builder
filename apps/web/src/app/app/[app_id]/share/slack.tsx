import * as React from 'react'
import { InfoIcon, PlusIcon } from 'lucide-react'
import useSWR, { useSWRConfig } from 'swr'
import useSWRMutation from 'swr/mutation'

import { SLACK_AUTHORIZE_URL } from '@/lib/const'
import { fetcher } from '@/lib/utils'
import { SlackTeamApp } from '@/db/slack_team_apps/schema'
import { SlackTeam } from '@/db/slack_teams/schema'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { HoverTooltip } from '@/components/hover-tooltip'

function TeamCard({
  icon,
  name,
  url,
  checked,
  onCheckedChange,
  disabled = false,
  onRemove,
}: {
  icon: string
  name: string
  url: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  onRemove: () => void
}) {
  return (
    <div className="group flex w-[540px] items-center justify-between">
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
        {disabled ? (
          <HoverTooltip content="Only the administrator of this workspace has the privilege to share.">
            <InfoIcon className=" text-red-500" />
          </HoverTooltip>
        ) : (
          <Switch
            defaultChecked={checked}
            onCheckedChange={onCheckedChange}
            disabled={disabled}
          />
        )}
      </div>
      {!disabled && (
        <Button
          variant="ghost"
          className="hidden group-hover:block"
          onClick={onRemove}
          disabled={disabled}
        >
          Disconnect
        </Button>
      )}
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

  const { trigger: triggerRemoveTeam, isMutating: isMutatingRemoveTeam } =
    useSWRMutation(`/api/slack/remove-team`, removeTeam)

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
        await mutate(`/api/slack/linked-teams/${context_app_id}`)
      },
    [triggerLinkTeamToApp, mutate]
  )

  const removeTeamHandler = React.useCallback(
    (app_id: string, team_id: string) => async () => {
      await triggerRemoveTeam({
        app_id,
        team_id,
      })
      await mutate(`/api/me/slack/teams`)
      toast({ description: 'The workspace has been disconnected' })
    },
    [triggerRemoveTeam, mutate, toast]
  )

  const isLoading = isLoadingTeamList || isLoadingLinkedTeamList

  return (
    <div>
      {teamList.length > 0 && !isLoading && (
        <div className="space-y-2">
          {teamList.map(
            ({
              app_id,
              team_id,
              team_name,
              team_url,
              team_icon,
              is_admin,
            }: any) => {
              const checked = checkIsLinked(app_id, team_id)
              const disabled = !is_admin
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
                  onRemove={removeTeamHandler(app_id, team_id)}
                  disabled={disabled}
                />
              )
            }
          )}
        </div>
      )}
      <div className="mt-2">
        <a
          href={SLACK_AUTHORIZE_URL}
          target="_blank"
          className="flex w-[408px] cursor-pointer items-center space-x-4 rounded-md border p-4"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded border border-slate-200">
            <PlusIcon className="h-6 w-6" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium leading-none">
              Share to a Slack Workspace
            </p>
          </div>
        </a>
      </div>
    </div>
  )
}
