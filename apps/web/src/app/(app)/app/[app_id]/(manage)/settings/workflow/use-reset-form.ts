import * as React from 'react'
import { FieldValues, UseFormReturn } from 'react-hook-form'

import { useWorkflowContext } from './store'

export default function useResetForm<T extends FieldValues>(
  form: UseFormReturn<T>,
  values: T
) {
  const { reset } = form
  const resetCount = useWorkflowContext((state) => state.resetCount)
  const valuesRef = React.useRef(values)

  React.useEffect(() => {
    valuesRef.current = values
  }, [values])

  React.useEffect(() => {
    if (resetCount > 0) {
      reset(valuesRef.current)
    }
  }, [resetCount, reset])
}
