import { ClassValue, clsx } from 'clsx'
import { format, isToday, isYesterday } from 'date-fns'
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

const VERCEL_URL = process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL

export const BASE_URL = VERCEL_URL
  ? `https://${
      process.env.VERCEL_ENV === 'production'
        ? 'build.withcontext.ai'
        : VERCEL_URL
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

export function formatTime(time: Date) {
  if (isToday(time)) {
    return format(time, 'hh:mm aa')
  }
  if (isYesterday(time)) {
    return `Yesterday at ${format(time, 'hh:mm aa')}`
  } else return format(time, 'MM/dd/yyyy hh:mm aa')
}

export function formatSeconds(seconds: number) {
  if (seconds < 3600) {
    return new Date(seconds * 1000).toISOString().substring(14, 19)
  }
  return new Date(seconds * 1000).toISOString().slice(11, 19)
}

export function clamp(num: number, min?: number, max?: number) {
  return Math.min(Math.max(num, min ?? -Infinity), max ?? Infinity)
}

export function encodeQueryData(data: Record<string, string | number>) {
  const ret = []
  for (const d in data)
    ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]))
  return ret.join('&')
}

export const labelFilterBuilder =
  (options: { label: string; value: string }[]) =>
  (value: string, search: string): number => {
    const label = options.find((d) => d.value === value)?.label
    if (label?.toLowerCase().includes(search.toLowerCase())) return 1
    return 0
  }

export function getPresetUrlOfImage(url: string, preset: string = 'thumbnail') {
  const isBytescale = url.startsWith('https://upcdn.io/')
  const imgTypes = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg']
  const isImage = imgTypes.some((type) => url.endsWith(`.${type}`))
  if (isBytescale && isImage) {
    return url.replace('/raw/', `/${preset}/`)
  }
  return url
}
