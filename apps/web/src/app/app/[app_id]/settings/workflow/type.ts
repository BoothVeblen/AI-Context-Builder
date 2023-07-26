export type WorkflowType = 'tool' | 'agent'

export type WorkflowItem = {
  id: string
  type: WorkflowType
  subType: string
  formValueStr: string
}

export type SelectOption = {
  label: string
  value: string
  icon?: string
}
