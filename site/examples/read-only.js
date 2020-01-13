import React, { useState, useMemo } from 'react'
import { createEditor } from 'slate'
import { Slate, Editable, withReact } from 'slate-react'

const ReadOnlyExample = () => {
  const [value, setValue] = useState(initialValue)
  const [readOnly, setReadOnly] = useState(true)
  const editor = useMemo(() => withReact(createEditor()), [])
  return (
    <>
      <Slate editor={editor} value={value} onChange={value => setValue(value)}>
        <Editable readOnly={readOnly} placeholder="Enter some plain text..." />
      </Slate>
      <hr />
      <p>
        State: { readOnly ? 'Read-Only' : 'Editable' }
        {' '} (<a onClick={ () => setReadOnly(!readOnly) } style={{color: 'blue', cursor: 'pointer'}}>Toggle</a>)
      </p>
    </>
  )
}

const initialValue = [
  {
    children: [
      { text: 'This is editable plain text, just like a <textarea>!' },
    ],
  },
]

export default ReadOnlyExample
