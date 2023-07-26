import { ClassValue, clsx } from 'clsx'
import ms from 'ms'
import { customAlphabet } from 'nanoid'
import { twMerge } from 'tailwind-merge'

import runes from './runes'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isImage(url: string) {
  return /\.(jpg|jpeg|png|webp|avif|gif|svg)$/.test(url)
}

export const timeAgo = (timestamp: Date, timeOnly?: boolean): string => {
  if (!timestamp) return 'never'
  return `${ms(Date.now() - new Date(timestamp).getTime())}${
    timeOnly ? '' : ' ago'
  }`
}

// https://planetscale.com/blog/why-we-chose-nanoids-for-planetscales-api
export const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  12
) // 12-character random string

// export const getFirstLetter = (str: string) => str.charAt(0).toUpperCase()
export const getFirstLetter = (str: string) => runes(str)?.[0]?.toUpperCase()

export const BASE_URL =
  process.env.VERCEL_URL || process.env.VERCEL_BRANCH_URL
    ? `https://${
        process.env.VERCEL_ENV === 'production'
          ? process.env.VERCEL_URL
          : process.env.VERCEL_BRANCH_URL
      }`
    : 'http://localhost:3000'

export const fetcher = (...args: Parameters<typeof fetch>) =>
  fetch(...args)
    .then((res) => res.json())
    .then((res) => {
      if (res.success) return res.data
      throw new Error(res.error)
    })

export function getAvatarBgColor(value: string) {
  const colors = [
    'red',
    'orange',
    'amber',
    'yellow',
    'lime',
    'green',
    'emerald',
    'teal',
    'cyan',
    'sky',
    'blue',
    'indigo',
    'violet',
    'purple',
    'fuchsia',
    'pink',
    'rose',
  ]

  const hash = value.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0)
  }, 0)

  const idx = hash % colors.length

  return colors[idx]
}

export function safeParse(str?: string | null, defaultReturn = {}) {
  try {
    if (!str) return defaultReturn
    return JSON.parse(str)
  } catch (error) {
    return defaultReturn
  }
}
