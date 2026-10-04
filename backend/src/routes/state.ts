import { Router } from 'express'
import { db } from '../db'
import { buildState, getCurrentStageId } from '../data'

const router = Router()

router.get('/state', (_req, res) => {
  res.json(buildState())
})

router.put('/vision', (req, res) => {
  const title = typeof req.body?.title === 'string' ? req.body.title : undefined
  const description = typeof req.body?.description === 'string' ? req.body.description : undefined
  if (title === undefined && description === undefined) {
    res.status(400).json({ error: 'nothing_to_update' })
    return
  }
  db.prepare(
    `UPDATE vision SET
       title = COALESCE(?, title),
       description = COALESCE(?, description)
     WHERE id = 1`,
  ).run(title ?? null, description ?? null)
  res.json(buildState())
})

router.put('/current-stage', (req, res) => {
  const stageId = typeof req.body?.stageId === 'string' ? req.body.stageId : ''
  const exists = db.prepare('SELECT id FROM stages WHERE id = ?').get(stageId)
  if (!exists) {
    res.status(400).json({ error: 'invalid_stage' })
    return
  }
  db.prepare(
    'INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
  ).run('current_stage_id', stageId)
  res.json(buildState())
})

router.get('/current-stage', (_req, res) => {
  const id = getCurrentStageId()
  if (!id) {
    res.json(null)
    return
  }
  const stage = db.prepare('SELECT id, name, position FROM stages WHERE id = ?').get(id)
  res.json(stage ?? null)
})

export default router
