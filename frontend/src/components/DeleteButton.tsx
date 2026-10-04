import Icon from './Icon'
import { useI18n } from '../lib/i18n'

type Props = {
  onConfirm: () => void | Promise<void>
  label?: string
  className?: string
  title?: string
}

export default function DeleteButton({ onConfirm, label, className = '', title }: Props) {
  const { t } = useI18n()
  const text = label ?? t('common.delete')

  return (
    <button
      type="button"
      title={title ?? t('common.delete')}
      aria-label={title ?? text ?? t('common.delete')}
      onClick={(event) => {
        event.stopPropagation()
        if (window.confirm(t('common.confirmDelete'))) void onConfirm()
      }}
      className={`inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg text-danger transition-colors duration-150 hover:bg-danger-soft ${
        text ? 'px-3 py-1.5 text-xs' : 'h-8 w-8'
      } ${className}`}
    >
      <Icon name="trash" className="h-4 w-4" />
      {text && <span>{text}</span>}
    </button>
  )
}
