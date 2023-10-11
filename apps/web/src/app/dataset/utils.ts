import { format } from 'date-fns'

export function formateNumber(characters: number) {
  const formatter = new Intl.NumberFormat('en', {
    notation: 'compact',
  })
  return formatter.format(characters)
}

export function formateDate(time: Date) {
  return format(new Date(`${time || 0}`), 'MM/dd/yyyy hh:mm aa')
}

export function formateIndex(index: number) {
  if (index < 10) {
    return `#00${index}`
  }
  if (index >= 10 && index < 100) {
    return `#0${index}`
  } else {
    return `#${index}`
  }
}

export function formateStatus(status: number) {
  const text = status === 0 ? 'Available' : status === 1 ? 'Indexing' : 'Error'
  const color =
    status === 0
      ? 'text-green-600'
      : status === 2
      ? 'text-red-600'
      : 'text-black'
  return { color, text }
}
