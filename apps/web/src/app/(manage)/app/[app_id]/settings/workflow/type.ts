export type WorkflowType = 'tool' | 'agent'

export type WorkflowItem = {
  key: number
  id: string
  type: WorkflowType
  subType: string
  formValueStr: string
}

export type SelectOption = {
  label: string
  value: string
  icon?: string
  status?: number
}
