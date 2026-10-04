import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { once } from 'node:events'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ican-test-'))
process.env.ICAN_DATA_DIR = dataDir
process.env.ICAN_PASSWORD = 'test-pass'

type State = {
  vision: { title: string; description: string }
  currentStageId: string | null
  stages: Array<{ id: string; name: string; position: number }>
  goals: Array<{ id: string; stage_id: string; name: string; position: number; completed: number }>
  steps: Array<{ id: string; goal_id: string; text: string; position: number }>
  resources: Array<{ id: string; stage_id: string; resource: string; why: string; url: string | null }>
  companies: Array<{ id: string; name: string; website: string | null; location: string | null; contact: string | null; description: string | null }>
}

let server: Server
let base = ''
let cookie = ''

async function req(method: string, url: string, body?: unknown) {
  const headers: Record<string, string> = {}
  if (cookie) headers.Cookie = cookie
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  return fetch(`${base}${url}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

async function state(): Promise<State> {
  const res = await req('GET', '/api/state')
  assert.equal(res.status, 200)
  return (await res.json()) as State
}

before(async () => {
  const { createApp } = await import('../src/app')
  server = createApp().listen(0)
  await once(server, 'listening')
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`

  const login = await req('POST', '/api/auth/login', { password: 'test-pass' })
  assert.equal(login.status, 200)
  const setCookie = login.headers.getSetCookie()
  assert.ok(setCookie.length > 0, 'login must set a session cookie')
  cookie = setCookie[0].split(';')[0]
})

after(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()))
  const { db } = await import('../src/db')
  db.close()
  try {
    fs.rmSync(dataDir, { recursive: true, force: true })
  } catch {
    /* temp cleanup is best effort */
  }
})

describe('authentication', () => {
  it('rejects an incorrect password', async () => {
    const res = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'wrong' }),
    })
    assert.equal(res.status, 401)
  })

  it('reports the authenticated session', async () => {
    const res = await req('GET', '/api/auth/me')
    assert.equal(res.status, 200)
    assert.deepEqual(await res.json(), { authenticated: true })
  })

  it('blocks data without a session', async () => {
    const res = await fetch(`${base}/api/state`)
    assert.equal(res.status, 401)
  })
})

describe('vision', () => {
  it('saves and returns the updated vision', async () => {
    const next = await (await req('PUT', '/api/vision', { description: 'رؤية محدثة' })).json()
    assert.equal((next as State).vision.description, 'رؤية محدثة')
    assert.equal((await state()).vision.description, 'رؤية محدثة')
  })
})

describe('stages', () => {
  it('creates, edits, reorders, sets current and deletes', async () => {
    const created = (await (await req('POST', '/api/stages', { name: 'مرحلة الاختبار' })).json()) as State
    const stage = created.stages.find((s) => s.name === 'مرحلة الاختبار')
    assert.ok(stage, 'created stage is present')

    const renamed = (await (await req('PUT', `/api/stages/${stage!.id}`, { name: 'مرحلة معدلة' })).json()) as State
    assert.equal(renamed.stages.find((s) => s.id === stage!.id)?.name, 'مرحلة معدلة')

    const before = (await state()).stages.map((s) => s.id)
    const reversed = [...before].reverse()
    const reordered = (await (await req('PUT', '/api/stages/reorder', { ids: reversed })).json()) as State
    assert.deepEqual(
      [...reordered.stages].sort((a, b) => a.position - b.position).map((s) => s.id),
      reversed,
    )

    const current = (await (await req('PUT', '/api/current-stage', { stageId: stage!.id })).json()) as State
    assert.equal(current.currentStageId, stage!.id)

    const afterDelete = (await (await req('DELETE', `/api/stages/${stage!.id}`)).json()) as State
    assert.ok(!afterDelete.stages.some((s) => s.id === stage!.id))

    if (afterDelete.stages.length > 0) {
      assert.ok(afterDelete.currentStageId, 'current stage never points at a deleted stage')
      assert.ok(afterDelete.stages.some((s) => s.id === afterDelete.currentStageId))
    }
  })
})

describe('goals', () => {
  it('belongs to a stage, edits once, completes and persists', async () => {
    let data = await state()
    const stage = data.stages[0]
    assert.ok(stage)

    data = (await (await req('POST', '/api/goals', { stageId: stage.id, name: 'هدف الاختبار' })).json()) as State
    const goal = data.goals.find((g) => g.name === 'هدف الاختبار')
    assert.ok(goal)
    assert.equal(goal!.stage_id, stage.id)
    assert.equal(data.goals.filter((g) => g.id === goal!.id).length, 1, 'goal exists exactly once')

    data = (await (await req('PUT', `/api/goals/${goal!.id}`, { name: 'هدف معدل' })).json()) as State
    assert.equal(data.goals.find((g) => g.id === goal!.id)?.name, 'هدف معدل')

    data = (await (await req('PUT', `/api/goals/${goal!.id}`, { completed: true })).json()) as State
    assert.equal(data.goals.find((g) => g.id === goal!.id)?.completed, 1)

    assert.equal((await state()).goals.find((g) => g.id === goal!.id)?.completed, 1, 'completion survives a reload')

    const stageGoals = (await state()).goals.filter((g) => g.stage_id === stage.id).map((g) => g.id)
    const reversed = [...stageGoals].reverse()
    data = (await (await req('PUT', '/api/goals/reorder', { ids: reversed })).json()) as State
    assert.deepEqual(
      data.goals
        .filter((g) => g.stage_id === stage.id)
        .sort((a, b) => a.position - b.position)
        .map((g) => g.id),
      reversed,
    )

    data = (await (await req('DELETE', `/api/goals/${goal!.id}`)).json()) as State
    assert.ok(!data.goals.some((g) => g.id === goal!.id))
  })
})

describe('steps', () => {
  it('creates, edits, reorders and deletes under a goal', async () => {
    let data = await state()
    const goalId = data.goals[0].id

    data = (await (await req('POST', '/api/steps', { goalId, text: 'خطوة أ' })).json()) as State
    const stepA = data.steps.find((s) => s.text === 'خطوة أ')
    assert.ok(stepA)
    assert.equal(stepA!.goal_id, goalId)

    data = (await (await req('POST', '/api/steps', { goalId, text: 'خطوة ب' })).json()) as State
    const stepB = data.steps.find((s) => s.text === 'خطوة ب')
    assert.ok(stepB)

    data = (await (await req('PUT', `/api/steps/${stepA!.id}`, { text: 'خطوة أ معدلة' })).json()) as State
    assert.equal(data.steps.find((s) => s.id === stepA!.id)?.text, 'خطوة أ معدلة')

    const goalSteps = data.steps.filter((s) => s.goal_id === goalId).map((s) => s.id)
    const reversed = [...goalSteps].reverse()
    data = (await (await req('PUT', '/api/steps/reorder', { ids: reversed })).json()) as State
    assert.deepEqual(
      data.steps
        .filter((s) => s.goal_id === goalId)
        .sort((a, b) => a.position - b.position)
        .map((s) => s.id),
      reversed,
    )

    data = (await (await req('DELETE', `/api/steps/${stepA!.id}`)).json()) as State
    assert.ok(!data.steps.some((s) => s.id === stepA!.id))
    data = (await (await req('DELETE', `/api/steps/${stepB!.id}`)).json()) as State
    assert.ok(!data.steps.some((s) => s.id === stepB!.id))
  })

  it('is removed when its goal is deleted', async () => {
    let data = await state()
    const stageId = data.stages[0].id
    data = (await (await req('POST', '/api/goals', { stageId })).json()) as State
    const goal = data.goals[data.goals.length - 1]
    data = (await (await req('POST', '/api/steps', { goalId: goal.id, text: 'خطوة' })).json()) as State
    const step = data.steps.find((s) => s.goal_id === goal.id)
    assert.ok(step)
    data = (await (await req('DELETE', `/api/goals/${goal.id}`)).json()) as State
    assert.ok(!data.steps.some((s) => s.id === step!.id), 'steps cascade with their goal')
  })
})

describe('resources', () => {
  it('creates, edits, supports an optional url and deletes', async () => {
    const stageId = (await state()).stages[0].id

    let data = (await (
      await req('POST', '/api/resources', { stageId, resource: 'مصدر', why: 'سبب', url: 'https://example.com' })
    ).json()) as State
    const resource = data.resources.find((r) => r.resource === 'مصدر')
    assert.ok(resource)
    assert.equal(resource!.stage_id, stageId)
    assert.equal(resource!.url, 'https://example.com')

    data = (await (
      await req('PUT', `/api/resources/${resource!.id}`, { resource: 'مصدر معدل', why: '', url: '' })
    ).json()) as State
    const updated = data.resources.find((r) => r.id === resource!.id)
    assert.equal(updated?.resource, 'مصدر معدل')
    assert.equal(updated?.url, null, 'an emptied url is stored as null')

    data = (await (await req('DELETE', `/api/resources/${resource!.id}`)).json()) as State
    assert.ok(!data.resources.some((r) => r.id === resource!.id))
  })

  it('is removed when its stage is deleted', async () => {
    let data = (await (await req('POST', '/api/stages', { name: 'مرحلة مؤقتة' })).json()) as State
    const stage = data.stages.find((s) => s.name === 'مرحلة مؤقتة')!
    data = (await (await req('POST', '/api/resources', { stageId: stage.id, resource: 'مؤقت', why: '' })).json()) as State
    const resource = data.resources.find((r) => r.stage_id === stage.id)!
    data = (await (await req('DELETE', `/api/stages/${stage.id}`)).json()) as State
    assert.ok(!data.resources.some((r) => r.id === resource.id), 'resources cascade with their stage')
  })
})

describe('tech companies', () => {
  it('creates, edits and deletes with all fields', async () => {
    let data = (await (
      await req('POST', '/api/companies', {
        name: 'Acme',
        website: 'https://acme.example',
        location: 'الرياض',
        contact: '+966500000000',
        description: 'شركة اختبار',
      })
    ).json()) as State
    const company = data.companies.find((c) => c.name === 'Acme')
    assert.ok(company)
    assert.equal(company!.location, 'الرياض')
    assert.equal(company!.contact, '+966500000000')

    data = (await (
      await req('PUT', `/api/companies/${company!.id}`, {
        name: 'Acme Updated',
        website: 'https://acme.example',
        location: 'جدة',
        contact: '+966511111111',
        description: 'محدث',
      })
    ).json()) as State
    assert.equal(data.companies.find((c) => c.id === company!.id)?.name, 'Acme Updated')

    data = (await (await req('DELETE', `/api/companies/${company!.id}`)).json()) as State
    assert.ok(!data.companies.some((c) => c.id === company!.id))
  })
})

describe('single source of truth', () => {
  it('reflects a goal edit made from a stage page in the shared state used by the vision page', async () => {
    let data = await state()
    const stageId = data.stages[0].id
    data = (await (await req('POST', '/api/goals', { stageId, name: 'اسم أولي' })).json()) as State
    const goal = data.goals.find((g) => g.name === 'اسم أولي')!
    await req('PUT', `/api/goals/${goal.id}`, { name: 'اسم من صفحة المرحلة' })
    const after = await state()
    const matches = after.goals.filter((g) => g.id === goal.id)
    assert.equal(matches.length, 1)
    assert.equal(matches[0].name, 'اسم من صفحة المرحلة')
    await req('DELETE', `/api/goals/${goal.id}`)
  })
})

describe('password change', () => {
  it('requires the current password, enforces a minimum length and swaps the password', async () => {
    const unauthenticated = await fetch(`${base}/api/auth/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current: 'test-pass', next: 'new-pass' }),
    })
    assert.equal(unauthenticated.status, 401, 'a session is required')

    const wrong = await req('PUT', '/api/auth/password', { current: 'not-it', next: 'new-pass' })
    assert.equal(wrong.status, 400, 'the current password must match')

    const weak = await req('PUT', '/api/auth/password', { current: 'test-pass', next: 'x' })
    assert.equal(weak.status, 400, 'the new password must meet the minimum length')

    const ok = await req('PUT', '/api/auth/password', { current: 'test-pass', next: 'new-pass' })
    assert.equal(ok.status, 200)

    const oldLogin = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'test-pass' }),
    })
    assert.equal(oldLogin.status, 401, 'the old password no longer works')

    const newLogin = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'new-pass' }),
    })
    assert.equal(newLogin.status, 200, 'the new password works')
  })
})
