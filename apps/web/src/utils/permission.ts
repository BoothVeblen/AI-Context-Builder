import 'server-only'

import { auth, currentUser } from '@/lib/auth'

export async function checkIsAdminOrOwner(ownerId: string) {
  const { userId } = auth()
  const { isAdmin } = await currentUser()
  const isOwner = userId === ownerId
  return isOwner || isAdmin
}

export async function checkIsAdminNotOwner(ownerId: string) {
  const { userId } = auth()
  const { isAdmin } = await currentUser()
  const isOwner = userId === ownerId
  return isAdmin && !isOwner
}
