import * as React from 'react'
import { FieldValues, UseFormReturn } from 'react-hook-form'
import { useDebounce } from 'usehooks-ts'

export default function useAutoSave<T extends FieldValues>(
  form: UseFormReturn<T>,
  defaultValues: T,
  onSave: (data: T) => void
) {
  const { watch, handleSubmit } = form

  const formValueStr = React.useMemo(
    () => JSON.stringify(watch()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(watch())]
  )
  const debouncedFormValueStr = useDebounce(formValueStr, 500)
  const latestFormValueStrRef = React.useRef(JSON.stringify(defaultValues))

  function onSubmit(data: T) {
    onSave(data)
    latestFormValueStrRef.current = JSON.stringify(data)
  }

  React.useEffect(() => {
    if (debouncedFormValueStr !== latestFormValueStrRef.current) {
      handleSubmit(onSubmit)()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedFormValueStr])
}
