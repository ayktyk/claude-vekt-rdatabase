import { z } from 'zod'

export const generateDefenseSimulationSchema = z.object({
  forceRerun: z.boolean().optional().default(false),
})

export const reviewDefenseSimulationSchema = z.object({
  approved: z.boolean(),
  reviewNotes: z.string().max(10000).optional().or(z.literal('')),
})

export type GenerateDefenseSimulationInput = z.infer<typeof generateDefenseSimulationSchema>
export type ReviewDefenseSimulationInput = z.infer<typeof reviewDefenseSimulationSchema>
