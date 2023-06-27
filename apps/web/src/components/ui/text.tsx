import React, { ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const textVariant = cva('inline-block', {
  variants: {
    variant: {
      h1: 'text-6xl font-extrabold text-gray-800',
      h2: 'text-5xl font-extrabold text-gray-800',
      h3: 'text-3xl font-bold text-gray-800',
      h4: 'text-base font-bold text-gray-800',
      h5: 'text-xl font-bold text-gray-800', //20px
      h6: 'text-base font-bold text-gray-800',
      subtitle1: 'text-base font-semibold text-black',
      subtitle2: 'text-sm font-semibold text-black',
      body1: 'text-base font-normal text-black', //16px
      body2: 'text-sm font-normal text-black', //14px
      default: 'text-sm font-normal text-black', //14px
      caption: 'text-xs font-medium	text-gray-500 leading-5	', //12px
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})
export interface TextProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof textVariant> {
  children?: ReactNode
  className?: string
}

const Text = ({ variant, children, className }: TextProps) => {
  return <p className={cn(textVariant({ variant }), className)}>{children}</p>
}

export default Text
