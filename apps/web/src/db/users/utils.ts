import { User, UserJSON } from '@clerk/nextjs/dist/types/server'

export function formatUserJSON(user: UserJSON) {
  const email = user.email_addresses.find(
    (email) => email.id === user.primary_email_address_id
  )?.email_address

  return {
    short_id: user.id,
    email,
    last_name: user.last_name,
    first_name: user.first_name,
    image_url: user.image_url,
    username: user.username,
    ...(user.created_at ? { created_at: new Date(user.created_at) } : {}),
    ...(user.updated_at ? { updated_at: new Date(user.updated_at) } : {}),
  }
}

export function formatUser(user: User) {
  const email = user.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId
  )?.emailAddress

  return {
    short_id: user.id,
    email,
    last_name: user.lastName,
    first_name: user.firstName,
    image_url: user.imageUrl,
    username: user.username,
    ...(user.createdAt ? { created_at: new Date(user.createdAt) } : {}),
    ...(user.updatedAt ? { updated_at: new Date(user.updatedAt) } : {}),
  }
}
