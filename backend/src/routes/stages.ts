import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { db, getSetting, setSetting } from '../db'
import { buildState, nextPosition } from '../data'

const router = Router()

router.post('/', (req, res) => {
  const name = typeof req.body?.name === 'string' && req.body.name.trim() ? req.body.name.trim() : 'مرحلة جديدة'
  const id = uuid()
  db.prepare('INSERT INTO stages(id, name, position) VALUES(?, ?, ?)').run(id, name, nextPosition('stages'))
  res.status(201).json(buildState())
})

router.put('/reorder', (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? (req.body.ids as string[]) : null
  if (!ids) {
    res.status(400).json({ error: 'invalid_ids' })
    return
  }
  const update = db.prepare('UPDATE stages SET position = ? WHERE id = ?')
  const run = db.transaction((list: string[]) => list.forEach((id, index) => update.run(index, id)))
  run(ids)
  res.json(buildState())
})

router.put('/:id', (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
  if (!name) {
    res.status(400).json({ error: 'invalid_name' })
    return
  }
  const result = db.prepare('UPDATE stages SET name = ? WHERE id = ?').run(name, req.params.id)
  if (result.changes === 0) {
    res.status(404).json({ error: 'not_found' })
    return
  }
  res.json(buildState())
})

router.delete('/:id', (req, res) => {
  const id = req.params.id
  const target = db.prepare('SELECT id FROM stages WHERE id = ?').get(id)
  if (!target) {
    res.status(404).json({ error: 'not_found' })
    return
  }
  db.prepare('DELETE FROM stages WHERE id = ?').run(id)

  if (getSetting('current_stage_id') === id) {
    const next = db.prepare('SELECT id FROM stages ORDER BY position LIMIT 1').get() as
      | { id: string }
      | undefined
    if (next) setSetting('current_stage_id', next.id)
    else db.prepare("DELETE FROM settings WHERE key = 'current_stage_id'").run()
  }

  res.json(buildState())
})

export default router
