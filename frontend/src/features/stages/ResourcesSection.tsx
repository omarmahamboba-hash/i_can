import { resourcesOf, useAppData } from '../../lib/store'
import { useI18n } from '../../lib/i18n'
import EditableText from '../../components/EditableText'
import DeleteButton from '../../components/DeleteButton'
import Icon from '../../components/Icon'

function toHref(url: string): string {
  if (/^https?:\/\//i.test(url)) return url
  return `https://${url}`
}

export default function ResourcesSection({ stageId }: { stageId: string }) {
  const { t } = useI18n()
  const { data, addResource, saveResource, removeResource } = useAppData()

  if (!data) return null

  const resources = resourcesOf(data, stageId)

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="section-title">{t('resources.title')}</h2>
        <button type="button" className="btn btn-ghost btn-sm gap-1.5" onClick={() => void addResource(stageId)}>
          <Icon name="plus" className="h-4 w-4" />
          {t('resources.add')}
        </button>
      </div>

      {resources.length === 0 ? (
        <div className="empty">{t('resources.empty')}</div>
      ) : (
        <div className="space-y-3">
          {resources.map((resource) => (
            <article key={resource.id} className="card group p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <EditableText
                    value={resource.resource}
                    onSave={(value) => saveResource({ ...resource, resource: value })}
                    className="text-sm font-semibold text-ink"
                    ariaLabel={t('resources.resource')}
                  />
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <EditableText
                      value={resource.url ?? ''}
                      onSave={(value) => saveResource({ ...resource, url: value || null })}
                      placeholder={t('resources.url')}
                      allowEmpty
                      className="text-xs text-accent"
                      ariaLabel={t('resources.url')}
                    />
                    {resource.url && (
                      <a
                        href={toHref(resource.url)}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={t('resources.openLink')}
                        title={t('resources.openLink')}
                        className="grid h-7 w-7 place-items-center rounded-lg text-muted transition-colors duration-150 hover:bg-accent-soft hover:text-accent"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Icon name="external" className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
                <DeleteButton
                  onConfirm={() => removeResource(resource.id)}
                  label=""
                  className="opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                />
              </div>
              <div className="mt-3 border-t border-line pt-3">
                <EditableText
                  value={resource.why}
                  onSave={(value) => saveResource({ ...resource, why: value })}
                  placeholder={t('resources.why')}
                  className="block text-sm leading-relaxed text-ink-soft"
                  multiline
                  ariaLabel={t('resources.why')}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
