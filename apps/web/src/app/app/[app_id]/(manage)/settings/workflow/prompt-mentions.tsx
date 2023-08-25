'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { findIndex } from 'lodash'
import { FieldValues, useFormContext } from 'react-hook-form'
import { Mention, MentionsInput } from 'react-mentions'

import useMentionsValue from '@/hooks/use-mention-value'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

import { ITextareaItem } from './form-item'
import styles from './mention-input.module.css'
import { useWorkflowContext } from './store'
import { WorkflowItem } from './type'

export const getToolKeys = (workflowData: WorkflowItem[]) => {
  return workflowData?.reduce(
    (m: { id: string; display: string }[], item: WorkflowItem) => {
      const key = `${item?.type}-${item?.key}.output`
      m?.push({ id: key, display: key })
      return m
    },
    []
  )
}

function PromptMentions<T extends FieldValues>({
  label,
  name,
}: ITextareaItem<T>) {
  const form = useFormContext<T>()
  const { watch } = form
  const prompt = watch()?.prompt.template
  const { value, onChange } = useMentionsValue(prompt)
  const workflowData = useWorkflowContext((state) => state.workflowData)

  const data = useMemo(() => getToolKeys(workflowData), [workflowData])

  useEffect(() => {
    onChange(prompt)
  }, [prompt])
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <MentionsInput
              value={value}
              onChange={(e) => {
                onChange(e.target.value)
                // @ts-ignore
                form.setValue(name, e?.target?.value)
              }}
              customSuggestionsContainer={(children) => (
                <div className="w-[212px] rounded-md border bg-white p-2 text-sm font-medium shadow-sm">
                  {children}
                </div>
              )}
              classNames={styles}
            >
              <Mention
                className={styles.mentions__mention}
                data={data}
                markup="[{__display__}]"
                trigger={/({([^.{]*))$/}
                appendSpaceOnAdd
                displayTransform={(_, display) => {
                  return `{${display}}`
                }}
              />
            </MentionsInput>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export default PromptMentions
