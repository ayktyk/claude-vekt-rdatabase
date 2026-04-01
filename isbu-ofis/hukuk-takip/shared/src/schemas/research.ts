import { z } from 'zod'

export const researchRunStatusValues = ['idle', 'running', 'completed', 'partial', 'failed'] as const

export const upsertCaseResearchProfileSchema = z.object({
  researchQuestion: z.string().max(20000).optional().or(z.literal('')),
  searchKeywords: z.string().max(10000).optional().or(z.literal('')),
  useNotebooklm: z.boolean().optional(),
  notebooklmNotebook: z.string().max(500).optional().or(z.literal('')),
  notebooklmQuestion: z.string().max(10000).optional().or(z.literal('')),
  useVectorDb: z.boolean().optional(),
  vectorCollections: z.string().max(5000).optional().or(z.literal('')),
  vectorQuery: z.string().max(10000).optional().or(z.literal('')),
  vectorTopK: z.number().int().min(1).max(10).optional(),
  useYargiMcp: z.boolean().optional(),
  yargiQuery: z.string().max(10000).optional().or(z.literal('')),
  yargiCourtTypes: z.string().max(500).optional().or(z.literal('')),
  yargiChamber: z.string().max(50).optional().or(z.literal('')),
  yargiDateStart: z.string().optional().or(z.literal('')),
  yargiDateEnd: z.string().optional().or(z.literal('')),
  yargiResultLimit: z.number().int().min(1).max(10).optional(),
  useMevzuatMcp: z.boolean().optional(),
  mevzuatQuery: z.string().max(10000).optional().or(z.literal('')),
  mevzuatScope: z.string().max(10000).optional().or(z.literal('')),
  mevzuatLawNumbers: z.string().max(500).optional().or(z.literal('')),
  mevzuatResultLimit: z.number().int().min(1).max(10).optional(),
})

export const runCaseResearchSchema = z.object({
  forceNewRun: z.boolean().optional().default(true),
})

// ─── Research QC Review ─────────────────────────────────────────────────────

export const researchReviewStatusValues = ['pending', 'approved', 'rejected'] as const

export const reviewCaseResearchSchema = z.object({
  approved: z.boolean(),
  reviewNotes: z.string().max(10000).optional().or(z.literal('')),
})

export const updateResearchArgumentSchema = z.object({
  artifactId: z.string().uuid(),
  argumentIndex: z.number().int().min(0),
  selected: z.boolean(),
})

export const batchUpdateResearchArgumentsSchema = z.object({
  updates: z.array(updateResearchArgumentSchema).min(1).max(100),
})

// ─── Types ──────────────────────────────────────────────────────────────────

export type UpsertCaseResearchProfileInput = z.infer<typeof upsertCaseResearchProfileSchema>
export type RunCaseResearchInput = z.infer<typeof runCaseResearchSchema>
export type ReviewCaseResearchInput = z.infer<typeof reviewCaseResearchSchema>
export type UpdateResearchArgumentInput = z.infer<typeof updateResearchArgumentSchema>
export type BatchUpdateResearchArgumentsInput = z.infer<typeof batchUpdateResearchArgumentsSchema>
