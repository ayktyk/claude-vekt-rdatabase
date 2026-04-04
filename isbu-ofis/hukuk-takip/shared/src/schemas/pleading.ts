import { z } from 'zod'

// ─── Pleading Generate ─────────────────────────────────────────────────────

export const documentTypeEnum = z.enum([
  'dava_dilekcesi',
  'ihtarname',
  'cevap_dilekcesi',
  'istinaf_dilekcesi',
  'temyiz_dilekcesi',
  'basvuru_dilekcesi',
])

export type DocumentType = z.infer<typeof documentTypeEnum>

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  dava_dilekcesi: 'Dava Dilekçesi',
  ihtarname: 'İhtarname',
  cevap_dilekcesi: 'Cevap Dilekçesi',
  istinaf_dilekcesi: 'İstinaf Dilekçesi',
  temyiz_dilekcesi: 'Temyiz Dilekçesi',
  basvuru_dilekcesi: 'Başvuru Dilekçesi',
}

export const generatePleadingSchema = z.object({
  forceRerun: z.boolean().optional().default(false),
  documentType: documentTypeEnum.optional(),
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
