import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useI18n } from '../lib/i18n'

type Props = {
  value: string
  onSave: (value: string) => void | Promise<void>
  multiline?: boolean
  placeholder?: string
  className?: string
  allowEmpty?: boolean
  ariaLabel?: string
  editing?: boolean
  onEditingChange?: (editing: boolean) => void
  readOnlyClick?: boolean
}

export default function EditableText({
  value,
  onSave,
  multiline = false,
  placeholder,
  className = '',
  allowEmpty = false,
  ariaLabel,
  editing: controlledEditing,
  onEditingChange,
  readOnlyClick = false,
}: Props) {
  const { t } = useI18n()
  const [internalEditing, setInternalEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  const isControlled = controlledEditing !== undefined
  const editing = isControlled ? controlledEditing : internalEditing

  function setEditing(next: boolean) {
    if (!isControlled) setInternalEditing(next)
    onEditingChange?.(next)
  }

  useEffect(() => {
    if (editing) ref.current?.focus()
  }, [editing])

  useEffect(() => {
    if (!editing) setDraft(value)
  }, [value, editing])

  function begin() {
    setDraft(value)
    setEditing(true)
  }

  async function commit() {
    const next = draft.trim()
    if ((!allowEmpty && !next) || next === value.trim()) {
      setEditing(false)
      return
    }
    setBusy(true)
    try {
      await onSave(next)
      setEditing(false)
    } catch {
      /* keep the field open so the change can be retried */
    } finally {
      setBusy(false)
    }
  }

  function cancel() {
    setDraft(value)
    setEditing(false)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      cancel()
      return
    }
    if (event.key === 'Enter' && (!multiline || event.ctrlKey || event.metaKey)) {
      event.preventDefault()
      void commit()
    }
  }

  if (editing) {
    const shared = {
      value: draft,
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(event.target.value),
      onKeyDown,
      className: `input ${multiline ? 'min-h-24 resize-y leading-relaxed' : ''}`,
      'aria-label': ariaLabel,
      disabled: busy,
    }
    return (
      <span className="block" onClick={(event) => event.stopPropagation()}>
        {multiline ? (
          <textarea {...shared} ref={ref as React.RefObject<HTMLTextAreaElement>} />
        ) : (
          <input {...shared} ref={ref as React.RefObject<HTMLInputElement>} />
        )}
        <span className="mt-2 flex gap-2">
          <button
            type="button"
            className="btn btn-primary px-3 py-1 text-xs"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => void commit()}
          >
            {t('common.save')}
          </button>
          <button
            type="button"
            className="btn btn-ghost px-3 py-1 text-xs"
            onMouseDown={(event) => event.preventDefault()}
            onClick={cancel}
          >
            {t('common.cancel')}
          </button>
        </span>
      </span>
    )
  }

  if (readOnlyClick) {
    return <span className={value ? className : `text-muted ${className}`}>{value || placeholder || '—'}</span>
  }

  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={(event) => {
        event.stopPropagation()
        begin()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          begin()
        }
      }}
      className={`-mx-1 cursor-text rounded-md px-1 transition-colors duration-150 hover:bg-accent-soft ${
        value ? className : `text-muted ${className}`
      }`}
    >
      {value || placeholder || '—'}
    </span>
  )
}
