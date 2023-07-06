'use client'

import { Button } from '@/components/ui/button'

import { useFormContext } from './form-provider'

export default function FormActions() {
  const { reset } = useFormContext()

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2">
      <div className="flex h-18 w-[600px] items-center justify-end space-x-2 rounded-lg border border-slate-100 bg-background px-4 shadow-md">
        <Button type="button" variant="ghost" onClick={() => reset()}>
          Reset
        </Button>
        <Button type="submit">Submit</Button>
      </div>
    </div>
  )
}
