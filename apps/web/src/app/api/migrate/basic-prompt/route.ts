import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { eq } from 'drizzle-orm'
import pLimit from 'p-limit'

import { db } from '@/lib/drizzle-edge'
import { safeParse } from '@/lib/utils'
import { AppsTable } from '@/db/apps/schema'
import { TreeItem } from '@/components/dnd/types'
import {
  DEFAULT_MEMORY,
  TASK_DEFAULT_VALUE_MAP,
} from '@/app/(app)/app/[app_id]/(manage)/settings/workflow/const'
import { WorkflowItem } from '@/app/(app)/app/[app_id]/(manage)/settings/workflow/type'
import {
  formatTreeWithData,
  taskToApiFormatter,
} from '@/app/(app)/app/[app_id]/(manage)/settings/workflow/utils'

const limit = pLimit(5)

function cleanWorkflowData(data: WorkflowItem[]) {
  const result = []

  for (const item of data) {
    const { id, subType, formValueStr } = item
    const formValue = safeParse(formValueStr, {})
    if (subType === 'conversation_chain' && formValue?.prompt?.basic_prompt) {
      const newFormValue = {
        ...formValue,
        prompt: {
          ...formValue.prompt,
          basic_prompt: '',
        },
      }
      const newItem = {
        ...item,
        formValueStr: JSON.stringify(newFormValue),
      }
      result.push(newItem)
      continue
    } else if (
      subType === 'conversational_retrieval_qa_chain' &&
      formValue?.prompt?.basic_prompt
    ) {
      const newFormValue = {
        ...formValue,
        prompt: {
          ...formValue.prompt,
          basic_prompt:
            TASK_DEFAULT_VALUE_MAP['conversational_retrieval_qa_chain'].prompt
              .basic_prompt,
        },
      }
      const newItem = {
        ...item,
        formValueStr: JSON.stringify(newFormValue),
      }
      result.push(newItem)
      continue
    } else if (
      subType === 'self_checking_chain' &&
      formValue?.prompt?.check_prompt
    ) {
      const newFormValue = {
        ...formValue,
        prompt: {
          ...formValue.prompt,
          check_prompt:
            TASK_DEFAULT_VALUE_MAP['self_checking_chain'].prompt.check_prompt,
        },
      }
      const newItem = {
        ...item,
        formValueStr: JSON.stringify(newFormValue),
      }
      result.push(newItem)
    }
    result.push(item)
  }

  return result
}

function fixTokenLimit(data: WorkflowItem[]) {
  const result = []

  for (const item of data) {
    const { id, subType, formValueStr, type, key } = item
    const formValue = safeParse(formValueStr, {})
    let newValue = { ...formValue }
    if (!formValue?.memory?.memory_type) {
      newValue = {
        ...newValue,
        memory: DEFAULT_MEMORY,
      }
    }
    if (
      subType === 'self_checking_chain' &&
      !formValue?.prompt?.output_definition
    ) {
      const keyLabel = `${type}-${key}`
      const output_definition = `The goal is [{target}].
[{${keyLabel}.dialog}].
Please output the target based on this conversation.`
      newValue.prompt.output_definition = output_definition
    }

    newValue.llm.max_tokens = 256
    newValue.llm.temperature = 0.7

    const newItem = { ...item, formValueStr: JSON.stringify(newValue) }
    result.push(newItem)
  }

  return result
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const secret = searchParams.get('secret')
    if (secret == null || secret !== process.env.SECRET) {
      return NextResponse.json({ success: true })
    }

    const apps = await db.select().from(AppsTable)
    const newApps = []

    for (const app of apps) {
      const {
        short_id,
        api_model_id,
        workflow_tree_str,
        workflow_data_str,
        published_workflow_tree_str,
        published_workflow_data_str,
      } = app

      const workflow_data = safeParse(workflow_data_str, []) as WorkflowItem[]
      const published_workflow_data = safeParse(
        published_workflow_data_str,
        []
      ) as WorkflowItem[]

      const new_workflow_data = fixTokenLimit(workflow_data)
      const new_published_workflow_data = fixTokenLimit(published_workflow_data)
      const newApp = {
        short_id,
        api_model_id,
        workflow_tree_str,
        workflow_data_str: JSON.stringify(new_workflow_data),
        published_workflow_tree_str,
        published_workflow_data_str: JSON.stringify(
          new_published_workflow_data
        ),
      }
      newApps.push(newApp)
    }

    const queue = []

    for (const app of newApps) {
      const {
        short_id,
        api_model_id,
        workflow_tree_str,
        workflow_data_str,
        published_workflow_tree_str,
        published_workflow_data_str,
      } = app

      queue.push(
        limit(() => {
          console.log('update db:', short_id)
          return db
            .update(AppsTable)
            .set({
              workflow_data_str,
              published_workflow_data_str,
            })
            .where(eq(AppsTable.short_id, short_id))
        })
      )

      const tree = safeParse(published_workflow_tree_str, []) as TreeItem[]
      const data = safeParse(published_workflow_data_str, []) as WorkflowItem[]
      const workflow = formatTreeWithData(tree, data)
      const chains = workflow.map(taskToApiFormatter)
      queue.push(
        limit(() => {
          console.log('update model:', api_model_id)
          return axios.patch(
            `${process.env.AI_SERVICE_API_BASE_URL}/v1/models/${api_model_id}`,
            { chains }
          )
        })
      )
    }

    await Promise.allSettled(queue)

    const data = {
      newApps,
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
