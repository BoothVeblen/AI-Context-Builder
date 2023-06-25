import { Options } from 'react-markdown'

export interface MarkdownProps extends Options {
  className?: string
  loading?: boolean
  showCustomerCard?: boolean
}
