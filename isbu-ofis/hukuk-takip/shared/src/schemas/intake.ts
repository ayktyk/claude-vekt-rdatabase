import { z } from 'zod'

export const briefingStatusValues = ['draft', 'review_pending', 'approved'] as const

export const upsertCaseIntakeProfileSchema = z.object({
  lawyerDirection: z.string().max(20000).optional().or(z.literal('')),
  clientInterviewNotes: z.string().max(30000).optional().or(z.literal('')),
  criticalPointSummary: z.string().max(20000).optional().or(z.literal('')),
  mainLegalAxis: z.string().max(10000).optional().or(z.literal('')),
  secondaryRisks: z.string().max(20000).optional().or(z.literal('')),
  proofRisks: z.string().max(20000).optional().or(z.literal('')),
  missingInformation: z.string().max(20000).optional().or(z.literal('')),
  missingDocuments: z.string().max(20000).optional().or(z.literal('')),
  opponentInitialArguments: z.string().max(20000).optional().or(z.literal('')),
})

export const approveCaseIntakeProfileSchema = z.object({
  approved: z.boolean().default(true),
  lawyerDirection: z.string().max(20000).optional().or(z.literal('')),
  clientInterviewNotes: z.string().max(30000).optional().or(z.literal('')),
  criticalPointSummary: z.string().max(20000).optional().or(z.literal('')),
  mainLegalAxis: z.string().max(10000).optional().or(z.literal('')),
  secondaryRisks: z.string().max(20000).optional().or(z.literal('')),
  proofRisks: z.string().max(20000).optional().or(z.literal('')),
  missingInformation: z.string().max(20000).optional().or(z.literal('')),
  missingDocuments: z.string().max(20000).optional().or(z.literal('')),
  opponentInitialArguments: z.string().max(20000).optional().or(z.literal('')),
})

export const generateCriticalPointSchema = z.object({
  lawyerDirection: z.string().max(20000).optional().or(z.literal('')),
  clientInterviewNotes: z.string().max(30000).optional().or(z.literal('')),
})

export const generateCaseBriefingSchema = z.object({
  toneStrategy: z.string().max(5000).optional().or(z.literal('')),
})

export const approveCaseBriefingSchema = z.object({
  approved: z.boolean().default(true),
})

export type UpsertCaseIntakeProfileInput = z.infer<typeof upsertCaseIntakeProfileSchema>
export type ApproveCaseIntakeProfileInput = z.infer<typeof approveCaseIntakeProfileSchema>
export type GenerateCriticalPointInput = z.infer<typeof generateCriticalPointSchema>
export type GenerateCaseBriefingInput = z.infer<typeof generateCaseBriefingSchema>
export type ApproveCaseBriefingInput = z.infer<typeof approveCaseBriefingSchema>
