import { db, getSetting } from './db'

export type StageRow = { id: string; name: string; position: number }
export type GoalRow = { id: string; stage_id: string; name: string; position: number; completed: number }
export type StepRow = { id: string; goal_id: string; text: string; position: number }
export type ResourceRow = { id: string; stage_id: string; resource: string; why: string; url: string | null }
export type CompanyRow = {
  id: string
  name: string
  website: string | null
  location: string | null
  contact: string | null
  description: string | null
  position: number
}

export function nextPosition(table: 'stages' | 'goals' | 'steps' | 'companies', where = '', params: unknown[] = []): number {
  const row = db
    .prepare(`SELECT COALESCE(MAX(position), -1) + 1 AS next FROM ${table} ${where}`)
    .get(...params) as { next: number }
  return row.next
}

export function getCurrentStageId(): string | null {
  return getSetting('current_stage_id')
}

export function buildState() {
  const vision = db.prepare('SELECT title, description FROM vision WHERE id = 1').get() as
    | { title: string; description: string }
    | undefined

  const stages = db.prepare('SELECT id, name, position FROM stages ORDER BY position').all() as StageRow[]
  const goals = db
    .prepare('SELECT id, stage_id, name, position, completed FROM goals ORDER BY position')
    .all() as GoalRow[]
  const steps = db.prepare('SELECT id, goal_id, text, position FROM steps ORDER BY position').all() as StepRow[]
  const resources = db
    .prepare('SELECT id, stage_id, resource, why, url FROM resources')
    .all() as ResourceRow[]
  const companies = db
    .prepare('SELECT id, name, website, location, contact, description, position FROM companies ORDER BY position')
    .all() as CompanyRow[]

  const currentStageId = getCurrentStageId()
  const validCurrent = stages.some((s) => s.id === currentStageId) ? currentStageId : (stages[0]?.id ?? null)

  return {
    vision: vision ?? { title: '', description: '' },
    currentStageId: validCurrent,
    stages,
    goals,
    steps,
    resources,
    companies,
  }
}
