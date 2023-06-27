import Text from '@/components/ui/text'
import AppSettingDialog from '@/components/app-setting-dialog'
import AuthButton from '@/components/auth-button'
import SessionList from '@/components/session-list'

export default async function AppSidebar({ appId }: { appId: string }) {
  return (
    <>
      <div className="h-[139px] w-60 bg-[url('https://backend.withcontext.ai/backend/upload/2023/04/65947928-68d6-4f64-99d9-0b98578fe4c6.jpeg')] bg-[length:240px_139px] bg-origin-content px-4 py-3 text-lg font-semibold leading-7">
        <div className="flex h-full w-full justify-between  text-white">
          App: {appId}
          <AppSettingDialog appId={appId} />
        </div>
      </div>
      <Text variant="caption" className=" px-4 py-3 text-slate-500">
        It includes activities that allow new employees to complete an initial
        new-hire orientation process, as well as learn about the organization
        and its structure, culture, vision, mission and values.
      </Text>
      <div className="m-full h-px bg-slate-100" />
      <div className="w-full flex-1 overflow-y-auto p-4">
        <SessionList appId={appId} />
      </div>
      <AuthButton />
    </>
  )
}
