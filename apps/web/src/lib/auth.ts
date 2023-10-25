import {
  auth as clerkAuth,
  currentUser as clerkCurrentUser,
} from '@clerk/nextjs'

export function auth() {
  return clerkAuth()
}

export async function currentUser() {
  const { emailAddresses, firstName, lastName, imageUrl, privateMetadata } =
    (await clerkCurrentUser()) ?? {}
  const name = [firstName || '', lastName || ''].join(' ').trim()
  const email = emailAddresses?.[0].emailAddress
  const isAdmin = ((privateMetadata?.roles as string[]) || []).includes('admin')

  return {
    email,
    name,
    imageUrl,
    isAdmin,
  }
}

export async function currentUserEmail() {
  const { emailAddresses } = (await clerkCurrentUser()) ?? {}
  const email = emailAddresses?.[0].emailAddress
  if (email) return email
}
