import { z } from 'zod'

export const procedureStatusValues = [
  'not_started',
  'precheck_done',
  'generating',
  'draft',
  'approved',
  'rejected',
] as const

export const generateProcedurePrecheckSchema = z.object({
  forceRerun: z.boolean().optional().default(false),
})

export const generateProcedureReportSchema = z.object({
  forceRerun: z.boolean().optional().default(false),
})

export const reviewProcedureReportSchema = z.object({
  approved: z.boolean(),
  rejectionNotes: z.string().max(10000).optional().or(z.literal('')),
})

export type GenerateProcedurePrecheckInput = z.infer<typeof generateProcedurePrecheckSchema>
export type GenerateProcedureReportInput = z.infer<typeof generateProcedureReportSchema>
export type ReviewProcedureReportInput = z.infer<typeof reviewProcedureReportSchema>
