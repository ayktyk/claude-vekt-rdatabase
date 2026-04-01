// Types
export * from './types.js'

// Schemas
export * from './schemas/auth.js'
export * from './schemas/client.js'
export * from './schemas/case.js'
export * from './schemas/hearing.js'
export * from './schemas/task.js'
export * from './schemas/expense.js'
export * from './schemas/collection.js'
export * from './schemas/note.js'
export * from './schemas/aiJob.js'
export * from './schemas/intake.js'
export * from './schemas/research.js'
export * from './schemas/pleading.js'
export * from './schemas/defenseSimulation.js'

// Explicit re-exports help the client bundler resolve shared runtime symbols.
export {
  caseStatusValues,
  caseTypeValues,
  automationStatusValues,
  createCaseSchema,
  updateCaseSchema,
} from './schemas/case.js'

export {
  aiJobTypeValues,
  aiJobStatusValues,
  aiJobStepStatusValues,
  aiReviewStatusValues,
  createAiJobSchema,
  runAiJobStepSchema,
  reviewAiJobSchema,
} from './schemas/aiJob.js'

export {
  briefingStatusValues,
  upsertCaseIntakeProfileSchema,
  approveCaseIntakeProfileSchema,
  generateCriticalPointSchema,
  generateCaseBriefingSchema,
  approveCaseBriefingSchema,
} from './schemas/intake.js'

export {
  researchRunStatusValues,
  researchReviewStatusValues,
  upsertCaseResearchProfileSchema,
  runCaseResearchSchema,
  reviewCaseResearchSchema,
  updateResearchArgumentSchema,
  batchUpdateResearchArgumentsSchema,
} from './schemas/research.js'

export * from './schemas/procedure.js'

export {
  procedureStatusValues,
  generateProcedurePrecheckSchema,
  generateProcedureReportSchema,
  reviewProcedureReportSchema,
} from './schemas/procedure.js'
