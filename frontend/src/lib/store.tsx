import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from './api'
import type { AppData, CompanyInput, Goal, Resource, Step } from './types'

type Status = 'loading' | 'ready' | 'error'

type AppDataValue = {
  data: AppData | null
  status: Status
  error: boolean
  clearError: () => void
  reload: () => Promise<void>
  setVision: (patch: { title?: string; description?: string }) => Promise<void>
  setCurrentStage: (stageId: string) => Promise<void>
  addStage: () => Promise<void>
  renameStage: (id: string, name: string) => Promise<void>
  removeStage: (id: string) => Promise<void>
  reorderStages: (orderedIds: string[]) => Promise<void>
  addGoal: (stageId: string) => Promise<void>
  renameGoal: (id: string, name: string) => Promise<void>
  toggleGoal: (goal: Goal) => Promise<void>
  removeGoal: (id: string) => Promise<void>
  reorderGoals: (orderedIds: string[]) => Promise<void>
  addStep: (goalId: string) => Promise<void>
  renameStep: (id: string, text: string) => Promise<void>
  removeStep: (id: string) => Promise<void>
  reorderSteps: (orderedIds: string[]) => Promise<void>
  addResource: (stageId: string) => Promise<void>
  saveResource: (resource: Resource) => Promise<void>
  removeResource: (id: string) => Promise<void>
  addCompany: (input: CompanyInput) => Promise<void>
  saveCompany: (id: string, input: CompanyInput) => Promise<void>
  removeCompany: (id: string) => Promise<void>
}

const AppDataContext = createContext<AppDataValue | null>(null)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState(false)

  const reload = useCallback(async () => {
    try {
      const next = await api.get<AppData>('/state')
      setData(next)
      setStatus('ready')
      setError(false)
    } catch {
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const run = useCallback(async (action: () => Promise<AppData>) => {
    try {
      const next = await action()
      setData(next)
      setStatus('ready')
      setError(false)
    } catch (cause) {
      console.error(cause)
      setError(true)
    }
  }, [])

  const clearError = useCallback(() => setError(false), [])

  const value = useMemo<AppDataValue>(
    () => ({
      data,
      status,
      error,
      clearError,
      reload,
      setVision: (patch) => run(() => api.put<AppData>('/vision', patch)),
      setCurrentStage: (stageId) => run(() => api.put<AppData>('/current-stage', { stageId })),
      addStage: () => run(() => api.post<AppData>('/stages', {})),
      renameStage: (id, name) => run(() => api.put<AppData>(`/stages/${id}`, { name })),
      removeStage: (id) => run(() => api.del<AppData>(`/stages/${id}`)),
      reorderStages: (ids) => run(() => api.put<AppData>('/stages/reorder', { ids })),
      addGoal: (stageId) => run(() => api.post<AppData>('/goals', { stageId })),
      renameGoal: (id, name) => run(() => api.put<AppData>(`/goals/${id}`, { name })),
      toggleGoal: (goal) => run(() => api.put<AppData>(`/goals/${goal.id}`, { completed: !goal.completed })),
      removeGoal: (id) => run(() => api.del<AppData>(`/goals/${id}`)),
      reorderGoals: (ids) => run(() => api.put<AppData>('/goals/reorder', { ids })),
      addStep: (goalId) => run(() => api.post<AppData>('/steps', { goalId })),
      renameStep: (id, text) => run(() => api.put<AppData>(`/steps/${id}`, { text })),
      removeStep: (id) => run(() => api.del<AppData>(`/steps/${id}`)),
      reorderSteps: (ids) => run(() => api.put<AppData>('/steps/reorder', { ids })),
      addResource: (stageId) => run(() => api.post<AppData>('/resources', { stageId })),
      saveResource: (resource) =>
        run(() =>
          api.put<AppData>(`/resources/${resource.id}`, {
            resource: resource.resource,
            why: resource.why,
            url: resource.url,
          }),
        ),
      removeResource: (id) => run(() => api.del<AppData>(`/resources/${id}`)),
      addCompany: (input) => run(() => api.post<AppData>('/companies', input)),
      saveCompany: (id, input) => run(() => api.put<AppData>(`/companies/${id}`, input)),
      removeCompany: (id) => run(() => api.del<AppData>(`/companies/${id}`)),
    }),
    [data, status, error, clearError, reload, run],
  )

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData(): AppDataValue {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider')
  return ctx
}

export function goalsOf(data: AppData, stageId: string): Goal[] {
  return data.goals.filter((goal) => goal.stage_id === stageId).sort((a, b) => a.position - b.position)
}

export function stepsOf(data: AppData, goalId: string): Step[] {
  return data.steps.filter((step) => step.goal_id === goalId).sort((a, b) => a.position - b.position)
}

export function resourcesOf(data: AppData, stageId: string): Resource[] {
  return data.resources.filter((resource) => resource.stage_id === stageId)
}
