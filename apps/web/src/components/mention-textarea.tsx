import * as React from 'react'
import {
  Mention,
  MentionsInput,
  OnChangeHandlerFunc,
  SuggestionDataItem,
} from 'react-mentions'

import styles from './mention-textarea.module.css'

interface IProps {
  value: string
  onChange: (value: string) => void
  data: SuggestionDataItem[]
}

const MentionTextarea = React.forwardRef<HTMLTextAreaElement, IProps>(
  ({ value, onChange, data }, ref) => {
    const handleChange = React.useCallback<OnChangeHandlerFunc>(
      (event, newValue, newPlainTextValue, mentions) => {
        onChange(newValue)
      },
      [onChange]
    )

    return (
      <MentionsInput
        value={value}
        onChange={handleChange}
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
    )
  }
)
MentionTextarea.displayName = 'MentionTextarea'

export { MentionTextarea }
