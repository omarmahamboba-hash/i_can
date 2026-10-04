import { useId, useState } from 'react'
import { stepsOf, useAppData } from '../../lib/store'
import { useI18n } from '../../lib/i18n'
import { moved } from '../../lib/collection'
import type { Goal } from '../../lib/types'
import EditableText from '../../components/EditableText'
import DeleteButton from '../../components/DeleteButton'
import Icon from '../../components/Icon'

export default function GoalItem({ goal }: { goal: Goal }) {
  const { t } = useI18n()
  const { data, toggleGoal, removeGoal, renameGoal, addStep, renameStep, removeStep, reorderSteps } = useAppData()
  const [expanded, setExpanded] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const panelId = useId()

  const steps = data ? stepsOf(data, goal.id) : []
  const completed = Boolean(goal.completed)

  return (
    <article
      className={`card group overflow-hidden transition-colors duration-200 ${
        completed ? 'border-done/25 bg-done-soft' : ''
      }`}
    >
      <div
        className="flex cursor-pointer items-center gap-2 px-4 py-3.5"
        onClick={() => setExpanded((value) => !value)}
      >
        <button
          type="button"
          aria-label={completed ? t('goal.markIncomplete') : t('goal.markComplete')}
          aria-pressed={completed}
          onClick={(event) => {
            event.stopPropagation()
            void toggleGoal(goal)
          }}
          className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-colors duration-200 ${
            completed
              ? 'border-done bg-done text-white'
              : 'border-line-strong text-transparent hover:border-done hover:text-done'
          }`}
        >
          <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} />
        </button>

        <div className="min-w-0 flex-1">
          <EditableText
            value={goal.name}
            onSave={(name) => renameGoal(goal.id, name)}
            editing={editingName}
            onEditingChange={setEditingName}
            readOnlyClick
            className={`text-[15px] transition-colors duration-200 ${
              completed ? 'text-muted line-through decoration-done/40' : 'text-ink'
            }`}
          />
        </div>

        <button
          type="button"
          aria-label={t('common.edit')}
          onClick={(event) => {
            event.stopPropagation()
            setExpanded(true)
            setEditingName(true)
          }}
          className="icon-btn icon-btn-sm"
        >
          <Icon name="pencil" className="h-4 w-4" />
        </button>

        <button
          type="button"
          aria-label={expanded ? t('goal.collapse') : t('goal.expand')}
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={(event) => {
            event.stopPropagation()
            setExpanded((value) => !value)
          }}
          className={`icon-btn icon-btn-sm transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        >
          <Icon name="chevron" className="h-4 w-4" />
        </button>

        <DeleteButton
          onConfirm={() => removeGoal(goal.id)}
          label=""
          className="opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
        />
      </div>

      <div
        id={panelId}
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="space-y-2 border-t border-line px-4 py-4">
            {steps.length === 0 && <p className="text-xs text-muted">{t('goal.noSteps')}</p>}
            {steps.map((step, index) => (
              <div key={step.id} className="group/step flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-line-strong" aria-hidden />
                <div className="min-w-0 flex-1">
                  <EditableText
                    value={step.text}
                    onSave={(text) => renameStep(step.id, text)}
                    className="text-sm text-ink-soft"
                    ariaLabel={t('goal.steps')}
                  />
                </div>
                <div className="flex shrink-0 items-center">
                  <button
                    type="button"
                    title={t('common.moveUp')}
                    aria-label={t('common.moveUp')}
                    disabled={index === 0}
                    onClick={() => {
                      const next = moved(steps, index, -1)
                      if (next) void reorderSteps(next.map((item) => item.id))
                    }}
                    className="icon-btn icon-btn-sm"
                  >
                    <Icon name="arrow-up" className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    title={t('common.moveDown')}
                    aria-label={t('common.moveDown')}
                    disabled={index === steps.length - 1}
                    onClick={() => {
                      const next = moved(steps, index, 1)
                      if (next) void reorderSteps(next.map((item) => item.id))
                    }}
                    className="icon-btn icon-btn-sm"
                  >
                    <Icon name="arrow-down" className="h-3.5 w-3.5" />
                  </button>
                  <DeleteButton
                    onConfirm={() => removeStep(step.id)}
                    label=""
                    className="opacity-100 md:opacity-0 md:group-hover/step:opacity-100 md:focus-visible:opacity-100"
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              className="mt-1 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-ink-soft transition-colors duration-150 hover:bg-surface-2 hover:text-accent"
              onClick={() => void addStep(goal.id)}
            >
              <Icon name="plus" className="h-3.5 w-3.5" />
              {t('goal.addStep')}
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
