import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { db } from '../db'
import { buildState, nextPosition } from '../data'

const router = Router()

router.post('/', (req, res) => {
  const stageId = typeof req.body?.stageId === 'string' ? req.body.stageId : ''
  const stage = db.prepare('SELECT id FROM stages WHERE id = ?').get(stageId)
  if (!stage) {
    res.status(400).json({ error: 'invalid_stage' })
    return
  }
  const name = typeof req.body?.name === 'string' && req.body.name.trim() ? req.body.name.trim() : 'هدف جديد'
  const id = uuid()
  db.prepare('INSERT INTO goals(id, stage_id, name, position, completed) VALUES(?, ?, ?, ?, 0)').run(
    id,
    stageId,
    name,
    nextPosition('goals', 'WHERE stage_id = ?', [stageId]),
  )
  res.status(201).json(buildState())
})

router.put('/reorder', (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? (req.body.ids as string[]) : null
  if (!ids) {
    res.status(400).json({ error: 'invalid_ids' })
    return
  }
  const update = db.prepare('UPDATE goals SET position = ? WHERE id = ?')
  const run = db.transaction((list: string[]) => list.forEach((id, index) => update.run(index, id)))
  run(ids)
  res.json(buildState())
})

router.put('/:id', (req, res) => {
  const row = db.prepare('SELECT id FROM goals WHERE id = ?').get(req.params.id)
  if (!row) {
    res.status(404).json({ error: 'not_found' })
    return
  }
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : undefined
  const completed =
    req.body?.completed === undefined ? undefined : req.body.completed ? 1 : 0
  if (name === undefined && completed === undefined) {
    res.status(400).json({ error: 'nothing_to_update' })
    return
  }
  db.prepare('UPDATE goals SET name = COALESCE(?, name), completed = COALESCE(?, completed) WHERE id = ?').run(
    name ?? null,
    completed ?? null,
    req.params.id,
  )
  res.json(buildState())
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM goals WHERE id = ?').run(req.params.id)
  res.json(buildState())
})

export default router
