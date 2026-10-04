import { Link, useParams } from 'react-router-dom'
import { goalsOf, useAppData } from '../../lib/store'
import { useI18n } from '../../lib/i18n'
import GoalItem from './GoalItem'
import ResourcesSection from './ResourcesSection'
import Icon from '../../components/Icon'

export default function StagePage() {
  const { t } = useI18n()
  const { id } = useParams<{ id: string }>()
  const { data, status, addGoal } = useAppData()

  if (status === 'loading' || !data) {
    return <p className="text-sm text-muted">{t('common.loading')}</p>
  }

  const stage = data.stages.find((item) => item.id === id)
  if (!stage) {
    return (
      <div className="empty">
        <p>{t('vision.noStages')}</p>
        <Link to="/vision" className="link mt-4 inline-block text-sm">
          {t('vision.title')}
        </Link>
      </div>
    )
  }

  const goals = goalsOf(data, stage.id)
  const done = goals.filter((goal) => goal.completed).length
  const percent = goals.length === 0 ? 0 : Math.round((done / goals.length) * 100)

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <Link
          to="/vision"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors duration-150 hover:text-ink"
        >
          <Icon name="arrow-left" className="h-3.5 w-3.5 rtl:-scale-x-100" />
          {t('vision.title')}
        </Link>
        <h1 className="page-title">{stage.name}</h1>
        {goals.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-done transition-[width] duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="shrink-0 text-xs font-medium tabular-nums text-muted">
              {done}/{goals.length}
            </span>
          </div>
        )}
      </header>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">{t('goals.title')}</h2>
          <button type="button" className="btn btn-ghost btn-sm gap-1.5" onClick={() => void addGoal(stage.id)}>
            <Icon name="plus" className="h-4 w-4" />
            {t('vision.addGoal')}
          </button>
        </div>

        {goals.length === 0 ? (
          <div className="empty">{t('vision.noGoals')}</div>
        ) : (
          <div className="space-y-2.5">
            {goals.map((goal) => (
              <GoalItem key={goal.id} goal={goal} />
            ))}
          </div>
        )}
      </section>

      <ResourcesSection stageId={stage.id} />
    </div>
  )
}
