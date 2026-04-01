import { z } from 'zod'

export const caseStatusValues = [
  'active',
  'istinafta',
  'yargÄ±tayda',
  'passive',
  'closed',
  'won',
  'lost',
  'settled',
] as const

export const caseTypeValues = [
  'iscilik_alacagi',
  'bosanma',
  'velayet',
  'mal_paylasimi',
  'kira',
  'tuketici',
  'icra',
  'ceza',
  'idare',
  'diger',
] as const

export const automationStatusValues = [
  'not_started',
  'folder_ready',
  'briefing_ready',
  'research_ready',
  'draft_ready',
  'review_ready',
  'completed',
] as const

export const createCaseSchema = z.object({
  clientId: z.string().uuid('Gecerli bir muvekkil secin'),
  caseNumber: z.string().max(100).optional().or(z.literal('')),
  courtName: z.string().max(255).optional().or(z.literal('')),
  caseType: z.enum(caseTypeValues, { errorMap: () => ({ message: 'Dava turu secin' }) }),
  customCaseType: z.string().max(255).optional().or(z.literal('')),
  title: z.string().min(3, 'Dava basligi en az 3 karakter olmalidir').max(500),
  description: z.string().max(10000).optional().or(z.literal('')),
  startDate: z.string().optional().or(z.literal('')),
  automationCaseCode: z.string().max(120).optional().or(z.literal('')),
  automationStatus: z.enum(automationStatusValues).default('not_started'),
  driveFolderPath: z.string().max(1000).optional().or(z.literal('')),
  briefingPath: z.string().max(1000).optional().or(z.literal('')),
  procedurePath: z.string().max(1000).optional().or(z.literal('')),
  researchPath: z.string().max(1000).optional().or(z.literal('')),
  defenseSimulationPath: z.string().max(1000).optional().or(z.literal('')),
  revisionPath: z.string().max(1000).optional().or(z.literal('')),
  pleadingMdPath: z.string().max(1000).optional().or(z.literal('')),
  pleadingUdfPath: z.string().max(1000).optional().or(z.literal('')),
  contractedFee: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Gecerli bir tutar girin')
    .optional()
    .or(z.literal('')),
  currency: z.string().length(3).default('TRY'),
})

export const updateCaseSchema = createCaseSchema.partial().extend({
  status: z.enum(caseStatusValues).optional(),
  closeDate: z.string().optional().or(z.literal('')),
})

export type CreateCaseInput = z.infer<typeof createCaseSchema>
export type UpdateCaseInput = z.infer<typeof updateCaseSchema>
