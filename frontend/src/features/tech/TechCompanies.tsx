import { useAppData } from '../../lib/store'
import { useI18n } from '../../lib/i18n'
import EditableText from '../../components/EditableText'
import DeleteButton from '../../components/DeleteButton'
import Icon from '../../components/Icon'
import type { Company } from '../../lib/types'

function toHref(url: string): string {
  if (/^https?:\/\//i.test(url)) return url
  return `https://${url}`
}

export default function TechCompanies() {
  const { t } = useI18n()
  const { data, status, addCompany, saveCompany, removeCompany } = useAppData()

  if (status === 'loading' || !data) {
    return <p className="text-sm text-muted">{t('common.loading')}</p>
  }

  const companies = [...data.companies].sort((a, b) => a.position - b.position)
  const save = (company: Company, patch: Partial<Company>) =>
    saveCompany(company.id, {
      name: patch.name ?? company.name,
      website: patch.website !== undefined ? patch.website : company.website,
      location: patch.location !== undefined ? patch.location : company.location,
      contact: patch.contact !== undefined ? patch.contact : company.contact,
      description: patch.description !== undefined ? patch.description : company.description,
    })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="page-title">{t('companies.title')}</h1>
        <button
          type="button"
          className="btn btn-ghost btn-sm gap-1.5"
          onClick={() => void addCompany({ name: t('companies.name') })}
        >
          <Icon name="plus" className="h-4 w-4" />
          {t('companies.add')}
        </button>
      </div>

      {companies.length === 0 ? (
        <div className="empty">{t('companies.empty')}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {companies.map((company) => (
            <article key={company.id} className="card group flex flex-col p-5">
              <header className="flex items-start gap-3">
                <span className="icon-tile">
                  <Icon name="building" />
                </span>
                <div className="min-w-0 flex-1">
                  <EditableText
                    value={company.name}
                    onSave={(name) => save(company, { name })}
                    className="block text-lg font-semibold"
                    ariaLabel={t('companies.name')}
                  />
                  {company.website && (
                    <a
                      href={toHref(company.website)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs text-accent transition-colors duration-150 hover:text-accent-strong"
                    >
                      <Icon name="external" className="h-3.5 w-3.5" />
                      {t('companies.visit')}
                    </a>
                  )}
                </div>
                <DeleteButton
                  onConfirm={() => removeCompany(company.id)}
                  label=""
                  className="opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                />
              </header>

              <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
                <div className="min-w-0">
                  <dt className="field-label">{t('companies.location')}</dt>
                  <dd>
                    <EditableText
                      value={company.location ?? ''}
                      onSave={(location) => save(company, { location: location || null })}
                      placeholder="—"
                      allowEmpty
                      className="text-ink-soft"
                      ariaLabel={t('companies.location')}
                    />
                  </dd>
                </div>

                <div className="min-w-0">
                  <dt className="field-label">{t('companies.contact')}</dt>
                  <dd>
                    <EditableText
                      value={company.contact ?? ''}
                      onSave={(contact) => save(company, { contact: contact || null })}
                      placeholder="—"
                      allowEmpty
                      className="text-ink-soft"
                      ariaLabel={t('companies.contact')}
                    />
                  </dd>
                </div>

                <div className="min-w-0 sm:col-span-2">
                  <dt className="field-label">{t('companies.website')}</dt>
                  <dd>
                    <EditableText
                      value={company.website ?? ''}
                      onSave={(website) => save(company, { website: website || null })}
                      placeholder="—"
                      allowEmpty
                      className="text-accent"
                      ariaLabel={t('companies.website')}
                    />
                  </dd>
                </div>

                <div className="min-w-0 sm:col-span-2">
                  <dt className="field-label">{t('companies.description')}</dt>
                  <dd>
                    <EditableText
                      value={company.description ?? ''}
                      onSave={(description) => save(company, { description: description || null })}
                      placeholder="—"
                      allowEmpty
                      multiline
                      className="leading-relaxed text-ink-soft"
                      ariaLabel={t('companies.description')}
                    />
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
