import { Link } from 'react-router-dom'
import { goalsOf, useAppData } from '../../lib/store'
import { useI18n } from '../../lib/i18n'
import { moved } from '../../lib/collection'
import EditableText from '../../components/EditableText'
import DeleteButton from '../../components/DeleteButton'
import Icon from '../../components/Icon'

export default function Vision() {
  const { t } = useI18n()
  const {
    data,
    status,
    setVision,
    setCurrentStage,
    addStage,
    renameStage,
    removeStage,
    reorderStages,
    addGoal,
    renameGoal,
    removeGoal,
    reorderGoals,
  } = useAppData()

  if (status === 'loading' || !data) {
    return <p className="text-sm text-muted">{t('common.loading')}</p>
  }

  const stages = [...data.stages].sort((a, b) => a.position - b.position)

  return (
    <div className="space-y-8">
      <div className="surface p-6 sm:p-7">
        <p className="eyebrow mb-3">{t('vision.title')}</p>
        <EditableText
          value={data.vision.title}
          onSave={(title) => setVision({ title })}
          placeholder="I CAN"
          className="block text-3xl font-semibold tracking-tight sm:text-4xl"
          ariaLabel={t('vision.title')}
        />
        <EditableText
          value={data.vision.description}
          onSave={(description) => setVision({ description })}
          placeholder={t('vision.descriptionPlaceholder')}
          className="mt-3 block max-w-2xl leading-relaxed text-ink-soft"
          multiline
          ariaLabel={t('vision.descriptionPlaceholder')}
        />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="section-title">{t('vision.stages')}</h2>
        <button type="button" className="btn btn-ghost btn-sm gap-1.5" onClick={() => void addStage()}>
          <Icon name="plus" className="h-4 w-4" />
          {t('vision.addStage')}
        </button>
      </div>

      {stages.length === 0 && <div className="empty">{t('vision.noStages')}</div>}

      <div className="space-y-4">
        {stages.map((stage, index) => {
          const goals = goalsOf(data, stage.id)
          const isCurrent = data.currentStageId === stage.id
          return (
            <section key={stage.id} className="card p-5">
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="badge">{String(index + 1).padStart(2, '0')}</span>
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <EditableText
                      value={stage.name}
                      onSave={(name) => renameStage(stage.id, name)}
                      className="text-lg font-semibold"
                      ariaLabel={t('vision.stageName')}
                    />
                    {isCurrent && (
                      <span className="chip chip-accent">
                        <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.5} />
                        {t('vision.isCurrent')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {!isCurrent && (
                    <button
                      type="button"
                      className="btn btn-quiet btn-sm"
                      onClick={() => void setCurrentStage(stage.id)}
                    >
                      {t('vision.setCurrent')}
                    </button>
                  )}
                  <Link to={`/stages/${stage.id}`} className="btn btn-quiet btn-sm gap-1.5">
                    {t('vision.openStage')}
                    <Icon name="arrow-right" className="h-3.5 w-3.5 rtl:-scale-x-100" />
                  </Link>
                  <span className="mx-0.5 h-5 w-px bg-line" aria-hidden />
                  <button
                    type="button"
                    title={t('common.moveUp')}
                    aria-label={t('common.moveUp')}
                    disabled={index === 0}
                    onClick={() => {
                      const next = moved(stages, index, -1)
                      if (next) void reorderStages(next.map((item) => item.id))
                    }}
                    className="icon-btn icon-btn-sm"
                  >
                    <Icon name="arrow-up" className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title={t('common.moveDown')}
                    aria-label={t('common.moveDown')}
                    disabled={index === stages.length - 1}
                    onClick={() => {
                      const next = moved(stages, index, 1)
                      if (next) void reorderStages(next.map((item) => item.id))
                    }}
                    className="icon-btn icon-btn-sm"
                  >
                    <Icon name="arrow-down" className="h-4 w-4" />
                  </button>
                  <DeleteButton onConfirm={() => removeStage(stage.id)} label="" />
                </div>
              </header>

              <ul className="mt-4 space-y-1">
                {goals.map((goal, goalIndex) => (
                  <li
                    key={goal.id}
                    className="group flex items-center justify-between gap-2 rounded-xl px-2 py-1.5 transition-colors duration-150 hover:bg-paper"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${
                          goal.completed ? 'border-done bg-done text-white' : 'border-line-strong text-transparent'
                        }`}
                        aria-hidden
                      >
                        <Icon name="check" className="h-3 w-3" strokeWidth={3} />
                      </span>
                      <EditableText
                        value={goal.name}
                        onSave={(name) => renameGoal(goal.id, name)}
                        className={`text-sm ${
                          goal.completed ? 'text-muted line-through decoration-done/40' : ''
                        }`}
                        ariaLabel={t('vision.goalName')}
                      />
                    </div>
                    <div className="flex items-center opacity-100 transition-opacity duration-150 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
                      <button
                        type="button"
                        title={t('common.moveUp')}
                        aria-label={t('common.moveUp')}
                        disabled={goalIndex === 0}
                        onClick={() => {
                          const next = moved(goals, goalIndex, -1)
                          if (next) void reorderGoals(next.map((item) => item.id))
                        }}
                        className="icon-btn icon-btn-sm"
                      >
                        <Icon name="arrow-up" className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title={t('common.moveDown')}
                        aria-label={t('common.moveDown')}
                        disabled={goalIndex === goals.length - 1}
                        onClick={() => {
                          const next = moved(goals, goalIndex, 1)
                          if (next) void reorderGoals(next.map((item) => item.id))
                        }}
                        className="icon-btn icon-btn-sm"
                      >
                        <Icon name="arrow-down" className="h-4 w-4" />
                      </button>
                      <DeleteButton onConfirm={() => removeGoal(goal.id)} label="" title={t('common.delete')} />
                    </div>
                  </li>
                ))}
              </ul>

              {goals.length === 0 && <p className="mt-3 text-xs text-muted">{t('vision.noGoals')}</p>}

              <button
                type="button"
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-ink-soft transition-colors duration-150 hover:bg-surface-2 hover:text-accent"
                onClick={() => void addGoal(stage.id)}
              >
                <Icon name="plus" className="h-3.5 w-3.5" />
                {t('vision.addGoal')}
              </button>
            </section>
          )
        })}
      </div>
    </div>
  )
}
