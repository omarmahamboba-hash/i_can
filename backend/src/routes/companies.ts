import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { db } from '../db'
import { buildState, nextPosition } from '../data'
import { optionalString } from '../util'

const router = Router()

router.post('/', (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
  if (!name) {
    res.status(400).json({ error: 'invalid_name' })
    return
  }
  const id = uuid()
  db.prepare(
    'INSERT INTO companies(id, name, website, location, contact, description, position) VALUES(?, ?, ?, ?, ?, ?, ?)',
  ).run(
    id,
    name,
    optionalString(req.body?.website),
    optionalString(req.body?.location),
    optionalString(req.body?.contact),
    optionalString(req.body?.description),
    nextPosition('companies'),
  )
  res.status(201).json(buildState())
})

router.put('/:id', (req, res) => {
  const row = db.prepare('SELECT id FROM companies WHERE id = ?').get(req.params.id)
  if (!row) {
    res.status(404).json({ error: 'not_found' })
    return
  }
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
  if (!name) {
    res.status(400).json({ error: 'invalid_name' })
    return
  }
  db.prepare(
    'UPDATE companies SET name = ?, website = ?, location = ?, contact = ?, description = ? WHERE id = ?',
  ).run(
    name,
    optionalString(req.body?.website),
    optionalString(req.body?.location),
    optionalString(req.body?.contact),
    optionalString(req.body?.description),
    req.params.id,
  )
  res.json(buildState())
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM companies WHERE id = ?').run(req.params.id)
  res.json(buildState())
})

export default router
