import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { db } from '../db'
import { buildState } from '../data'
import { optionalString } from '../util'

const router = Router()

router.post('/', (req, res) => {
  const stageId = typeof req.body?.stageId === 'string' ? req.body.stageId : ''
  const stage = db.prepare('SELECT id FROM stages WHERE id = ?').get(stageId)
  if (!stage) {
    res.status(400).json({ error: 'invalid_stage' })
    return
  }
  const resource = optionalString(req.body?.resource) ?? 'مصدر جديد'
  const why = typeof req.body?.why === 'string' ? req.body.why : ''
  const url = optionalString(req.body?.url)
  const id = uuid()
  db.prepare('INSERT INTO resources(id, stage_id, resource, why, url) VALUES(?, ?, ?, ?, ?)').run(
    id,
    stageId,
    resource,
    why,
    url,
  )
  res.status(201).json(buildState())
})

router.put('/:id', (req, res) => {
  const row = db.prepare('SELECT id FROM resources WHERE id = ?').get(req.params.id)
  if (!row) {
    res.status(404).json({ error: 'not_found' })
    return
  }
  const resource = typeof req.body?.resource === 'string' ? req.body.resource.trim() : ''
  if (!resource) {
    res.status(400).json({ error: 'invalid_resource' })
    return
  }
  const why = typeof req.body?.why === 'string' ? req.body.why : ''
  const url = optionalString(req.body?.url)
  db.prepare('UPDATE resources SET resource = ?, why = ?, url = ? WHERE id = ?').run(
    resource,
    why,
    url,
    req.params.id,
  )
  res.json(buildState())
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM resources WHERE id = ?').run(req.params.id)
  res.json(buildState())
})

export default router
