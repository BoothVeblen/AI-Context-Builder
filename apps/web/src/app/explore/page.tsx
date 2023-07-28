import AppCard from '@/components/app-card'
import RootWrapper from '@/components/root-wrapper'

// const LIST = [
//   {
//     id: 'CQolMcS',
//     name: 'Employee Handbook',
//     creator: '@Context Builder',
//     description:
//       "This is an employee handbook AI Bot. You can consult Context on company's vacation, benefits, corporate cultures, etc.",
//     icon: 'https://storage.googleapis.com/context-builder/public-tmp/yvz6XUK.jpeg',
//   },
//   {
//     id: 'wV8w8mV',
//     name: 'Onboarding',
//     creator: '@Context Builder',
//     description:
//       'This AI Bot can help new employees quickly understand the schedules and goals of their first day and first month.',
//     icon: 'https://storage.googleapis.com/context-builder/public-tmp/n8fgLWX.jpeg',
//   },
//   {
//     id: 'VtTNc8h',
//     name: 'TikTok User Guide',
//     creator: '@Context Builder',
//     description:
//       'This user guide AI Bot can help you quickly learn how to use TikTok.',
//     icon: 'https://storage.googleapis.com/context-builder/public-tmp/EVoNO2l.jpeg',
//   },
// ]
const LIST: any[] = []

export default async function Page() {
  return (
    <RootWrapper pageTitle="Explore">
      <div className="flex flex-col">
        <h1 className="hidden border-b border-slate-100 px-6 py-3 font-medium lg:block">
          Explore
        </h1>
        <div className="p-6">
          <h2 className="text-sm font-medium">All Categories</h2>
          <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {LIST.map(({ id, name, description, icon, creator }) => (
              <AppCard
                key={id}
                id={id}
                name={name}
                description={description}
                icon={icon}
                creator={creator}
              />
            ))}
          </ul>
        </div>
      </div>
    </RootWrapper>
  )
}
