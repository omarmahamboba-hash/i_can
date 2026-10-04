import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { db } from '../db'
import { buildState, nextPosition } from '../data'

const router = Router()

router.post('/', (req, res) => {
  const goalId = typeof req.body?.goalId === 'string' ? req.body.goalId : ''
  const goal = db.prepare('SELECT id FROM goals WHERE id = ?').get(goalId)
  if (!goal) {
    res.status(400).json({ error: 'invalid_goal' })
    return
  }
  const text = typeof req.body?.text === 'string' && req.body.text.trim() ? req.body.text.trim() : 'خطوة جديدة'
  const id = uuid()
  db.prepare('INSERT INTO steps(id, goal_id, text, position) VALUES(?, ?, ?, ?)').run(
    id,
    goalId,
    text,
    nextPosition('steps', 'WHERE goal_id = ?', [goalId]),
  )
  res.status(201).json(buildState())
})

router.put('/reorder', (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? (req.body.ids as string[]) : null
  if (!ids) {
    res.status(400).json({ error: 'invalid_ids' })
    return
  }
  const update = db.prepare('UPDATE steps SET position = ? WHERE id = ?')
  const run = db.transaction((list: string[]) => list.forEach((id, index) => update.run(index, id)))
  run(ids)
  res.json(buildState())
})

router.put('/:id', (req, res) => {
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : ''
  if (!text) {
    res.status(400).json({ error: 'invalid_text' })
    return
  }
  const result = db.prepare('UPDATE steps SET text = ? WHERE id = ?').run(text, req.params.id)
  if (result.changes === 0) {
    res.status(404).json({ error: 'not_found' })
    return
  }
  res.json(buildState())
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM steps WHERE id = ?').run(req.params.id)
  res.json(buildState())
})

export default router
