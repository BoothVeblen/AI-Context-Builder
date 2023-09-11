import { Options } from 'react-markdown'

export interface MarkdownProps extends Options {
  className?: string
  isUser?: boolean
  loading?: boolean
  showCustomerCard?: boolean
}
