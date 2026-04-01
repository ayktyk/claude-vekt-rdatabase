import { z } from 'zod'

// ─── Pleading Generate ─────────────────────────────────────────────────────

export const generatePleadingSchema = z.object({
  forceRerun: z.boolean().optional().default(false),
})

// ─── Pleading Review ────────────────────────────────────────────────────────

export const reviewPleadingSchema = z.object({
  approved: z.boolean(),
  reviewNotes: z.string().max(10000).optional().or(z.literal('')),
})

// ─── Pleading Manual Edit ───────────────────────────────────────────────────

export const updatePleadingDraftSchema = z.object({
  markdownContent: z.string().min(1).max(200000),
})

// ─── Types ──────────────────────────────────────────────────────────────────

export type GeneratePleadingInput = z.infer<typeof generatePleadingSchema>
export type ReviewPleadingInput = z.infer<typeof reviewPleadingSchema>
export type UpdatePleadingDraftInput = z.infer<typeof updatePleadingDraftSchema>
