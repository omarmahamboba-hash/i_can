import { v4 as uuid } from 'uuid'
import { db, getSetting, setSetting } from './db'

export function seed(): void {
  db.prepare("INSERT OR IGNORE INTO vision(id, title, description) VALUES(1, ?, ?)").run(
    'I CAN',
    'أن أصبح مهندس برمجيات قادرًا على بناء منتجات ذات أثر حقيقي.',
  )

  const existing = db.prepare('SELECT COUNT(*) AS count FROM stages').get() as { count: number }
  if (existing.count > 0) return

  const insertStage = db.prepare('INSERT INTO stages(id, name, position) VALUES(?, ?, ?)')
  const insertGoal = db.prepare(
    'INSERT INTO goals(id, stage_id, name, position, completed) VALUES(?, ?, ?, ?, 0)',
  )
  const insertStep = db.prepare('INSERT INTO steps(id, goal_id, text, position) VALUES(?, ?, ?, ?)')
  const insertResource = db.prepare(
    'INSERT INTO resources(id, stage_id, resource, why, url) VALUES(?, ?, ?, ?, ?)',
  )

  const seedAll = db.transaction(() => {
    const stage1 = uuid()
    const stage2 = uuid()
    const stage3 = uuid()
    insertStage.run(stage1, 'المرحلة 01 — الأساس', 0)
    insertStage.run(stage2, 'المرحلة 02 — البناء', 1)
    insertStage.run(stage3, 'المرحلة 03 — الأثر', 2)

    const goal1 = uuid()
    const goal2 = uuid()
    insertGoal.run(goal1, stage1, 'إتقان اللغة الإنجليزية', 0)
    insertGoal.run(goal2, stage1, 'تعلم أساسيات البرمجة', 1)

    insertStep.run(uuid(), goal1, 'ممارسة الاستماع يوميًا لمدة 20 دقيقة', 0)
    insertStep.run(uuid(), goal1, 'قراءة مقال قصير كل يوم', 1)
    insertStep.run(uuid(), goal2, 'إتمام أساسيات لغة JavaScript', 0)
    insertStep.run(uuid(), goal2, 'بناء خمسة تمارين صغيرة', 1)

    insertGoal.run(uuid(), stage2, 'بناء مشاريع حقيقية', 0)
    insertGoal.run(uuid(), stage2, 'إتقان تقنيات الويب', 1)
    insertGoal.run(uuid(), stage3, 'العمل ضمن فريق', 0)
    insertGoal.run(uuid(), stage3, 'إطلاق منتج شخصي', 1)

    insertResource.run(uuid(), stage1, 'MDN Web Docs', 'مرجع موثوق لأساسيات الويب', 'https://developer.mozilla.org')
    insertResource.run(uuid(), stage1, 'قناة تعلم الإنجليزية', 'تدريب يومي على الاستماع', null)
  })
  seedAll()

  if (!getSetting('current_stage_id')) {
    const first = db.prepare('SELECT id FROM stages ORDER BY position LIMIT 1').get() as { id: string } | undefined
    if (first) setSetting('current_stage_id', first.id)
  }
}
