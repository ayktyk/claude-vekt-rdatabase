import { z } from 'zod'

export const aiJobTypeValues = [
  'intake',
  'briefing',
  'procedure',
  'research',
  'pleading',
  'udf',
] as const

export const aiJobStatusValues = [
  'draft',
  'queued',
  'in_progress',
  'review_required',
  'completed',
  'failed',
  'cancelled',
] as const

export const aiJobStepStatusValues = [
  'pending',
  'in_progress',
  'completed',
  'failed',
  'blocked',
] as const

export const aiReviewStatusValues = ['pending', 'approved', 'changes_requested'] as const

export const createAiJobSchema = z.object({
  jobType: z.enum(aiJobTypeValues, { errorMap: () => ({ message: 'AI job tipi secin' }) }),
  title: z.string().max(255).optional().or(z.literal('')),
})

export const runAiJobStepSchema = z.object({
  stepKey: z.string().min(1, 'Adim anahtari gereklidir').max(100),
  status: z.enum(aiJobStepStatusValues, { errorMap: () => ({ message: 'Gecerli adim durumu secin' }) }),
  inputSnapshot: z.string().max(10000).optional().or(z.literal('')),
  outputSnapshot: z.string().max(10000).optional().or(z.literal('')),
  errorMessage: z.string().max(5000).optional().or(z.literal('')),
})

export const reviewAiJobSchema = z.object({
  artifactId: z.string().uuid('Gecerli bir artifact secin').optional().or(z.literal('')),
  reviewType: z.string().min(1, 'Review tipi gereklidir').max(100),
  status: z.enum(aiReviewStatusValues, { errorMap: () => ({ message: 'Gecerli review durumu secin' }) }),
  reviewNotes: z.string().max(10000).optional().or(z.literal('')),
})

export type CreateAiJobInput = z.infer<typeof createAiJobSchema>
export type RunAiJobStepInput = z.infer<typeof runAiJobStepSchema>
export type ReviewAiJobInput = z.infer<typeof reviewAiJobSchema>
