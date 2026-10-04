import { Link } from 'react-router-dom'
import Icon from '../../components/Icon'
import { useAppData } from '../../lib/store'
import { useI18n } from '../../lib/i18n'

export default function Home() {
  const { t } = useI18n()
  const { data, status } = useAppData()

  if (status === 'loading' || !data) {
    return <p className="text-sm text-muted">{t('common.loading')}</p>
  }

  const current = data.stages.find((stage) => stage.id === data.currentStageId) ?? null

  return (
    <div className="space-y-8 sm:space-y-10">
      <p className="eyebrow">{t('home.greeting')}</p>

      <Link
        to={current ? `/stages/${current.id}` : '/vision'}
        className="group relative block overflow-hidden rounded-2xl border border-accent/15 bg-accent-soft p-6 pe-16 transition duration-200 hover:border-accent/30 sm:p-8 sm:pe-20"
      >
        <span className="eyebrow text-accent/80">{t('home.currentStage')}</span>
        <span className="mt-3 block text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          {current ? current.name : t('home.noCurrentStage')}
        </span>
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-accent">
          {current ? t('home.openStage') : t('vision.setCurrent')}
          <span
            aria-hidden
            className="transition-transform duration-200 group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
          >
            <Icon name="arrow-right" className="h-4 w-4 rtl:-scale-x-100" />
          </span>
        </span>
        <span className="absolute end-5 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-surface text-accent shadow-sm transition-transform duration-200 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 sm:grid">
          <Icon name="arrow-right" className="h-5 w-5 rtl:-scale-x-100" />
        </span>
      </Link>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/vision" className="card card-hover group flex items-start gap-4 p-5">
          <span className="icon-tile transition-colors duration-200 group-hover:bg-accent-soft group-hover:text-accent">
            <Icon name="layers" />
          </span>
          <span className="min-w-0">
            <span className="block font-medium text-ink">{t('home.vision')}</span>
            <span className="mt-0.5 block text-sm text-muted">{t('home.visionHint')}</span>
          </span>
        </Link>
        <Link to="/tech" className="card card-hover group flex items-start gap-4 p-5">
          <span className="icon-tile transition-colors duration-200 group-hover:bg-accent-soft group-hover:text-accent">
            <Icon name="building" />
          </span>
          <span className="min-w-0">
            <span className="block font-medium text-ink">{t('home.tech')}</span>
            <span className="mt-0.5 block text-sm text-muted">{t('home.techHint')}</span>
          </span>
        </Link>
      </div>
    </div>
  )
}
