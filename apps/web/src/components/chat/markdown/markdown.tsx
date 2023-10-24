import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
// markdown plugins
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Text from '@/components/ui/text'
import { PdfImage, PreviewPdf } from '@/components/upload/component'

import { CodeBlock } from './code-block'
import { MarkdownProps } from './type'

export const Markdown = (props: MarkdownProps) => {
  const {
    className,
    showCustomerCard: showCustomerCard,
    isUser,
    ...others
  } = props
  return (
    <ReactMarkdown
      className={cn(
        'prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0',
        isUser ? 'text-white' : 'text-black'
      )}
      components={{
        p({ children }) {
          return (
            <p className="prose-sm mb-2 font-normal last:mb-0">{children}</p>
          )
        },
        li({ children }) {
          return <li className="prose-sm">{children}</li>
        },
        code({ node, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '')

          if (match) {
            return (
              <CodeBlock
                language={match[1]}
                value={String(children).replace(/\n$/, '')}
                {...props}
              />
            )
          }
          return (
            <code
              {...props}
              className={cn(className, isUser ? 'text-white' : 'text-black')}
            >
              {children}
            </code>
          )
        },
        a({ ...props }) {
          return (
            <a
              {...props}
              target="_blank"
              className={isUser ? 'text-white' : 'text-black'}
            />
          )
        },
      }}
      remarkPlugins={[remarkGfm, remarkMath]}
      {...others}
    />
  )
}

export const CustomerCard = () => {
  const [showMore, setShowMore] = useState<boolean>(false)
  const [open, setOpen] = useState<boolean>(false)
  const sources = [
    {
      uid: '',
      name: '3.pdf',
      url: '111',
    },
  ]
  return (
    <div className="prose">
      <div className="rounded-t-lg bg-primary p-3 text-white">
        <h6 className="prose text-white">Context summary</h6>
      </div>
      <div className="p-3">
        <h6 className="mb-3">this is summary</h6>
        <p className="prose-sm">source:</p>
        <div className="flex flex-wrap gap-2	">
          {sources?.map((file, index) => {
            return (
              <>
                <Badge variant="outline" key={index} className="gap-1">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback>
                      <PdfImage height="20" width="12" />
                    </AvatarFallback>
                  </Avatar>
                  <Text variant="body2" className="line-clamp-1	max-w-xs">
                    {file?.name}
                  </Text>
                </Badge>
                <PreviewPdf file={file} open={open} setOpen={setOpen} />
              </>
            )
          })}
        </div>
        <ExampleQuestion />
        <div className={`flex ${sources?.length < 6 ? 'hidden' : 'block'}`}>
          <Button
            variant="link"
            onClick={() => setShowMore(!showMore)}
            className="text-slate-900"
          >
            {!showMore ? 'Show More' : 'Show Less'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export const ExampleQuestion = () => {
  const questions = [
    'What types of organizations are covered by the law?\n',
    'When did the "Provisional Regulations on Wage Payment" come into effect?\n',
    "What are the labor rights that employees are entitled to under the Labor Law of the People's Republic of China?\n",
  ]
  return (
    <div className="mt-4">
      <Text variant="body2">Example Questions:</Text>
      <div className="flex flex-col gap-1">
        {questions?.map((item) => (
          <Text
            variant="body2"
            className="cursor-pointer hover:text-slate-900	"
            key={item}
          >
            {item}
          </Text>
        ))}
      </div>
    </div>
  )
}
