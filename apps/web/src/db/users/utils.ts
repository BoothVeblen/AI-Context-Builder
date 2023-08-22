import { UserJSON } from '@clerk/nextjs/dist/types/server'

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
