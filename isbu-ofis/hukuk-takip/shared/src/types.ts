// Ortak tip tanımları — Adım 2'de Zod şemalarıyla genişletilecek

export type CaseStatus =
  | 'active'
  | 'istinafta'
  | 'yargÄ±tayda'
  | 'passive'
  | 'closed'
  | 'won'
  | 'lost'
  | 'settled'

export type AutomationStatus =
  | 'not_started'
  | 'folder_ready'
  | 'briefing_ready'
  | 'research_ready'
  | 'draft_ready'
  | 'review_ready'
  | 'completed'

export type CaseType =
  | 'iscilik_alacagi'
  | 'bosanma'
  | 'velayet'
  | 'mal_paylasimi'
  | 'kira'
  | 'tuketici'
  | 'icra'
  | 'ceza'
  | 'idare'
  | 'diger'

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export type HearingResult = 'pending' | 'completed' | 'postponed' | 'cancelled'

export type ExpenseType = 'court_fee' | 'notary' | 'expert' | 'travel' | 'document' | 'other'

export type NotificationType = 'hearing' | 'deadline' | 'task' | 'payment' | 'system'

export type AiJobType = 'intake' | 'briefing' | 'procedure' | 'research' | 'pleading' | 'udf'

export type AiJobStatus =
  | 'draft'
  | 'queued'
  | 'in_progress'
  | 'review_required'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type AiJobStepStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked'

export type AiReviewStatus = 'pending' | 'approved' | 'changes_requested'

export type BriefingStatus = 'draft' | 'review_pending' | 'approved'

export type ResearchRunStatus = 'idle' | 'running' | 'completed' | 'partial' | 'failed'

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface ApiError {
  error: string
  details?: Record<string, string[]>
}
