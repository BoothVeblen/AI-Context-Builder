import { SignIn } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="flex min-h-full flex-1 flex-col justify-center">
      <div className="m-auto">
        <SignIn />
      </div>
    </div>
  )
}
