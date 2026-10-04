export type Vision = {
  title: string
  description: string
}

export type Stage = {
  id: string
  name: string
  position: number
}

export type Goal = {
  id: string
  stage_id: string
  name: string
  position: number
  completed: number
}

export type Step = {
  id: string
  goal_id: string
  text: string
  position: number
}

export type Resource = {
  id: string
  stage_id: string
  resource: string
  why: string
  url: string | null
}

export type Company = {
  id: string
  name: string
  website: string | null
  location: string | null
  contact: string | null
  description: string | null
  position: number
}

export type AppData = {
  vision: Vision
  currentStageId: string | null
  stages: Stage[]
  goals: Goal[]
  steps: Step[]
  resources: Resource[]
  companies: Company[]
}

export type CompanyInput = {
  name: string
  website?: string | null
  location?: string | null
  contact?: string | null
  description?: string | null
}
