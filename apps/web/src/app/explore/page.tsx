import { flags } from '@/lib/flags'
import { getAppsBasedOnIds } from '@/db/apps/actions'
import AppCard from '@/components/app-card'
import RootWrapper from '@/components/root-wrapper'

// const LIST = flags.isProd
//   ? [
//       {
//         id: 'R7cTLNuANTiD',
//         name: 'Product Customer Service',
//         creator: '@Context Builder',
//         description:
//           'Possess product knowledge and answer user questions like customer service.',
//         icon: 'https://storage.googleapis.com/context-builder/public-tmp/qeoEap4JkTmB.jpeg',
//       },
//       {
//         id: 'JS0VUKV07Jat',
//         name: 'Multilingual Translation Assistant',
//         creator: '@Context Builder',
//         description:
//           'Act as a translator and translate in different languages.',
//         icon: 'https://storage.googleapis.com/context-builder/public-tmp/vKFQ7Ev8SbKp.jpeg',
//       },
//       {
//         id: 'iBidZhqJSsBX',
//         name: 'Roleplay - Interviewer',
//         creator: '@Context Builder',
//         description:
//           'Serve as an interviewer and interview candidates for different positions.',
//         icon: 'https://storage.googleapis.com/context-builder/public-tmp/CY5nRzSGNsE5.jpeg',
//       },
//     ]
//   : []

export default async function Page() {
  const list = await getAppsBasedOnIds([
    'R7cTLNuANTiD',
    'JS0VUKV07Jat',
    'iBidZhqJSsBX',
  ])

  return (
    <RootWrapper pageTitle="Explore">
      <div className="flex flex-col">
        <h1 className="hidden border-b border-slate-200 px-6 py-3 font-medium lg:block">
          Explore
        </h1>
        <div className="p-6">
          <h2 className="text-sm font-medium">All Categories</h2>
          <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {list.map(({ short_id, name, description, icon }) => (
              <AppCard
                key={short_id}
                id={short_id}
                name={name}
                description={description}
                icon={icon}
                creator="@Context Builder"
              />
            ))}
          </ul>
        </div>
      </div>
    </RootWrapper>
  )
}
