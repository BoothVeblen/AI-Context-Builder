import Link from 'next/link'

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface IProps {
  id: string
  title: string
}

export default function DatasetCard({ id, title }: IProps) {
  return (
    <Link href={`/datasets`}>
      <Card className="h-full hover:shadow-md">
        <CardHeader>
          <CardTitle className="line-clamp-3 text-lg">{title}</CardTitle>
        </CardHeader>
      </Card>
    </Link>
  )
}
