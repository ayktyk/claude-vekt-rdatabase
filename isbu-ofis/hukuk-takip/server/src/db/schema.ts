import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  decimal,
  timestamp,
  date,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

// ─── Enum'lar ─────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum('user_role', ['admin', 'lawyer', 'assistant'])

export const caseStatusEnum = pgEnum('case_status', [
  'active',
  'istinafta',
  'yargıtayda',
  'passive',
  'closed',
  'won',
  'lost',
  'settled',
])

export const caseTypeEnum = pgEnum('case_type', [
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
])

export const automationStatusEnum = pgEnum('automation_status', [
  'not_started',
  'folder_ready',
  'briefing_ready',
  'research_ready',
  'draft_ready',
  'review_ready',
  'completed',
])

export const taskStatusEnum = pgEnum('task_status', [
  'pending',
  'in_progress',
  'completed',
  'cancelled',
])

export const taskPriorityEnum = pgEnum('task_priority', [
  'low',
  'medium',
  'high',
  'urgent',
])

export const hearingResultEnum = pgEnum('hearing_result', [
  'pending',
  'completed',
  'postponed',
  'cancelled',
])

export const expenseTypeEnum = pgEnum('expense_type', [
  'court_fee',
  'notary',
  'expert',
  'travel',
  'document',
  'other',
])

export const notificationTypeEnum = pgEnum('notification_type', [
  'hearing',
  'deadline',
  'task',
  'payment',
  'system',
])

export const aiJobStatusEnum = pgEnum('ai_job_status', [
  'draft',
  'queued',
  'in_progress',
  'review_required',
  'completed',
  'failed',
  'cancelled',
])

export const aiJobStepStatusEnum = pgEnum('ai_job_step_status', [
  'pending',
  'in_progress',
  'completed',
  'failed',
  'blocked',
])

export const aiReviewStatusEnum = pgEnum('ai_review_status', [
  'pending',
  'approved',
  'changes_requested',
])

export const briefingStatusEnum = pgEnum('briefing_status', [
  'draft',
  'review_pending',
  'approved',
])

export const researchRunStatusEnum = pgEnum('research_run_status', [
  'idle',
  'running',
  'completed',
  'partial',
  'failed',
])

export const procedureStatusEnum = pgEnum('procedure_status', [
  'not_started',
  'precheck_done',
  'generating',
  'draft',
  'approved',
  'rejected',
])

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    fullName: varchar('full_name', { length: 255 }).notNull(),
    role: userRoleEnum('role').default('lawyer').notNull(),
    barNumber: varchar('bar_number', { length: 50 }),
    phone: varchar('phone', { length: 20 }),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: uniqueIndex('users_email_idx').on(table.email),
  })
)

// ─── Clients (Müvekkiller) ─────────────────────────────────────────────────────

export const clients = pgTable(
  'clients',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'restrict' })
      .notNull(),
    fullName: varchar('full_name', { length: 255 }).notNull(),
    tcNo: varchar('tc_no', { length: 255 }), // AES-256-GCM ile şifreli
    phone: varchar('phone', { length: 20 }),
    email: varchar('email', { length: 255 }),
    address: text('address'),
    notes: text('notes'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('clients_user_idx').on(table.userId),
  })
)

// ─── Cases (Davalar) ──────────────────────────────────────────────────────────

export const cases = pgTable(
  'cases',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'restrict' })
      .notNull(),
    clientId: uuid('client_id')
      .references(() => clients.id, { onDelete: 'restrict' })
      .notNull(),
    caseNumber: varchar('case_number', { length: 100 }),
    courtName: varchar('court_name', { length: 255 }),
    caseType: caseTypeEnum('case_type').notNull(),
    customCaseType: varchar('custom_case_type', { length: 255 }),
    status: caseStatusEnum('status').default('active').notNull(),
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description'),
    startDate: date('start_date'),
    closeDate: date('close_date'),
    automationCaseCode: varchar('automation_case_code', { length: 120 }),
    automationStatus: automationStatusEnum('automation_status')
      .default('not_started')
      .notNull(),
    driveFolderPath: varchar('drive_folder_path', { length: 1000 }),
    briefingPath: varchar('briefing_path', { length: 1000 }),
    procedurePath: varchar('procedure_path', { length: 1000 }),
    researchPath: varchar('research_path', { length: 1000 }),
    defenseSimulationPath: varchar('defense_simulation_path', { length: 1000 }),
    revisionPath: varchar('revision_path', { length: 1000 }),
    pleadingMdPath: varchar('pleading_md_path', { length: 1000 }),
    pleadingUdfPath: varchar('pleading_udf_path', { length: 1000 }),
    contractedFee: decimal('contracted_fee', { precision: 12, scale: 2 }),
    currency: varchar('currency', { length: 3 }).default('TRY').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('cases_user_idx').on(table.userId),
    clientIdx: index('cases_client_idx').on(table.clientId),
    statusIdx: index('cases_status_idx').on(table.status),
  })
)

// ─── Case Hearings (Duruşmalar) ───────────────────────────────────────────────

export const caseHearings = pgTable(
  'case_hearings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    caseId: uuid('case_id')
      .references(() => cases.id, { onDelete: 'cascade' })
      .notNull(),
    hearingDate: timestamp('hearing_date').notNull(),
    courtRoom: varchar('court_room', { length: 100 }),
    judge: varchar('judge', { length: 255 }),
    result: hearingResultEnum('result').default('pending').notNull(),
    notes: text('notes'),
    nextHearingDate: timestamp('next_hearing_date'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    caseIdx: index('hearings_case_idx').on(table.caseId),
    dateIdx: index('hearings_date_idx').on(table.hearingDate),
  })
)

// ─── Tasks (Görevler) ─────────────────────────────────────────────────────────

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    caseId: uuid('case_id').references(() => cases.id, { onDelete: 'set null' }),
    label: varchar('label', { length: 100 }),
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description'),
    status: taskStatusEnum('status').default('pending').notNull(),
    priority: taskPriorityEnum('priority').default('medium').notNull(),
    dueDate: timestamp('due_date'),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('tasks_user_idx').on(table.userId),
    statusIdx: index('tasks_status_idx').on(table.status),
    dueDateIdx: index('tasks_due_date_idx').on(table.dueDate),
  })
)

// ─── Expenses (Masraflar) ─────────────────────────────────────────────────────

export const expenses = pgTable(
  'expenses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    caseId: uuid('case_id')
      .references(() => cases.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'restrict' })
      .notNull(),
    type: expenseTypeEnum('type').notNull(),
    description: varchar('description', { length: 500 }).notNull(),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).default('TRY').notNull(),
    expenseDate: date('expense_date').notNull(),
    receiptUrl: varchar('receipt_url', { length: 1000 }),
    isBillable: boolean('is_billable').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    caseIdx: index('expenses_case_idx').on(table.caseId),
  })
)

// ─── Collections (Tahsilatlar) ────────────────────────────────────────────────

export const collections = pgTable(
  'collections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    caseId: uuid('case_id')
      .references(() => cases.id, { onDelete: 'cascade' })
      .notNull(),
    clientId: uuid('client_id')
      .references(() => clients.id, { onDelete: 'restrict' })
      .notNull(),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).default('TRY').notNull(),
    collectionDate: date('collection_date').notNull(),
    description: varchar('description', { length: 500 }),
    paymentMethod: varchar('payment_method', { length: 50 }),
    receiptNo: varchar('receipt_no', { length: 100 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    caseIdx: index('collections_case_idx').on(table.caseId),
  })
)

// ─── Notifications (Bildirimler) ──────────────────────────────────────────────

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    type: notificationTypeEnum('type').notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    message: text('message').notNull(),
    relatedId: uuid('related_id'),
    relatedType: varchar('related_type', { length: 50 }),
    isRead: boolean('is_read').default(false).notNull(),
    scheduledFor: timestamp('scheduled_for'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userReadIdx: index('notifications_user_read_idx').on(table.userId, table.isRead),
  })
)

// ─── Documents (Belgeler) ─────────────────────────────────────────────────────

export const documents = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    caseId: uuid('case_id')
      .references(() => cases.id, { onDelete: 'cascade' })
      .notNull(),
    uploadedBy: uuid('uploaded_by')
      .references(() => users.id, { onDelete: 'restrict' })
      .notNull(),
    fileName: varchar('file_name', { length: 500 }).notNull(),
    fileUrl: varchar('file_url', { length: 1000 }).notNull(),
    fileSize: integer('file_size'),
    mimeType: varchar('mime_type', { length: 100 }),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    caseIdx: index('documents_case_idx').on(table.caseId),
  })
)

// ─── Notes (Notlar) ───────────────────────────────────────────────────────────

export const notes = pgTable('notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  caseId: uuid('case_id').references(() => cases.id, { onDelete: 'cascade' }),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ─── AI Jobs ──────────────────────────────────────────────────────────────────

export const aiJobs = pgTable(
  'ai_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    caseId: uuid('case_id')
      .references(() => cases.id, { onDelete: 'cascade' })
      .notNull(),
    createdBy: uuid('created_by')
      .references(() => users.id, { onDelete: 'restrict' })
      .notNull(),
    jobType: varchar('job_type', { length: 50 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    status: aiJobStatusEnum('status').default('draft').notNull(),
    currentStepKey: varchar('current_step_key', { length: 100 }),
    startedAt: timestamp('started_at'),
    finishedAt: timestamp('finished_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    caseIdx: index('ai_jobs_case_idx').on(table.caseId),
    statusIdx: index('ai_jobs_status_idx').on(table.status),
  })
)

export const aiJobSteps = pgTable(
  'ai_job_steps',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    jobId: uuid('job_id')
      .references(() => aiJobs.id, { onDelete: 'cascade' })
      .notNull(),
    stepKey: varchar('step_key', { length: 100 }).notNull(),
    stepLabel: varchar('step_label', { length: 255 }).notNull(),
    stepOrder: integer('step_order').notNull(),
    status: aiJobStepStatusEnum('status').default('pending').notNull(),
    inputSnapshot: text('input_snapshot'),
    outputSnapshot: text('output_snapshot'),
    errorMessage: text('error_message'),
    startedAt: timestamp('started_at'),
    finishedAt: timestamp('finished_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    jobIdx: index('ai_job_steps_job_idx').on(table.jobId),
    jobStepKeyIdx: uniqueIndex('ai_job_steps_job_step_key_idx').on(table.jobId, table.stepKey),
  })
)

export const aiJobArtifacts = pgTable(
  'ai_job_artifacts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    jobId: uuid('job_id')
      .references(() => aiJobs.id, { onDelete: 'cascade' })
      .notNull(),
    caseId: uuid('case_id')
      .references(() => cases.id, { onDelete: 'cascade' })
      .notNull(),
    artifactType: varchar('artifact_type', { length: 100 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    storagePath: varchar('storage_path', { length: 1000 }),
    contentPreview: text('content_preview'),
    versionNo: integer('version_no').default(1).notNull(),
    sourceStepKey: varchar('source_step_key', { length: 100 }),
    metadata: text('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    jobIdx: index('ai_job_artifacts_job_idx').on(table.jobId),
    caseIdx: index('ai_job_artifacts_case_idx').on(table.caseId),
  })
)

export const aiJobReviews = pgTable(
  'ai_job_reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    jobId: uuid('job_id')
      .references(() => aiJobs.id, { onDelete: 'cascade' })
      .notNull(),
    artifactId: uuid('artifact_id').references(() => aiJobArtifacts.id, { onDelete: 'set null' }),
    reviewType: varchar('review_type', { length: 100 }).notNull(),
    status: aiReviewStatusEnum('status').default('pending').notNull(),
    reviewNotes: text('review_notes'),
    reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
    reviewedAt: timestamp('reviewed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    jobIdx: index('ai_job_reviews_job_idx').on(table.jobId),
    artifactIdx: index('ai_job_reviews_artifact_idx').on(table.artifactId),
  })
)

export const aiJobSources = pgTable(
  'ai_job_sources',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    jobId: uuid('job_id')
      .references(() => aiJobs.id, { onDelete: 'cascade' })
      .notNull(),
    sourceType: varchar('source_type', { length: 50 }).notNull(),
    sourceName: varchar('source_name', { length: 255 }).notNull(),
    sourceLocator: varchar('source_locator', { length: 1000 }),
    isEnabled: boolean('is_enabled').default(true).notNull(),
    priority: integer('priority').default(100).notNull(),
    filterConfig: text('filter_config'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    jobIdx: index('ai_job_sources_job_idx').on(table.jobId),
  })
)

export const caseIntakeProfiles = pgTable(
  'case_intake_profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    caseId: uuid('case_id')
      .references(() => cases.id, { onDelete: 'cascade' })
      .notNull(),
    lawyerDirection: text('lawyer_direction'),
    clientInterviewNotes: text('client_interview_notes'),
    autoDocumentSummary: text('auto_document_summary'),
    autoFactSummary: text('auto_fact_summary'),
    criticalPointSummary: text('critical_point_summary'),
    mainLegalAxis: text('main_legal_axis'),
    secondaryRisks: text('secondary_risks'),
    proofRisks: text('proof_risks'),
    missingInformation: text('missing_information'),
    missingDocuments: text('missing_documents'),
    opponentInitialArguments: text('opponent_initial_arguments'),
    approvedByLawyer: boolean('approved_by_lawyer').default(false).notNull(),
    approvedBy: uuid('approved_by').references(() => users.id, { onDelete: 'set null' }),
    approvedAt: timestamp('approved_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    caseIdx: uniqueIndex('case_intake_profiles_case_idx').on(table.caseId),
  })
)

export const caseBriefings = pgTable(
  'case_briefings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    caseId: uuid('case_id')
      .references(() => cases.id, { onDelete: 'cascade' })
      .notNull(),
    versionNo: integer('version_no').default(1).notNull(),
    summary: text('summary'),
    mainGoal: text('main_goal'),
    secondaryGoal: text('secondary_goal'),
    mainProcedureRisk: text('main_procedure_risk'),
    mainProofRisk: text('main_proof_risk'),
    toneStrategy: text('tone_strategy'),
    markdownContent: text('markdown_content'),
    storagePath: varchar('storage_path', { length: 1000 }),
    status: briefingStatusEnum('status').default('draft').notNull(),
    approvedBy: uuid('approved_by').references(() => users.id, { onDelete: 'set null' }),
    approvedAt: timestamp('approved_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    caseIdx: uniqueIndex('case_briefings_case_idx').on(table.caseId),
  })
)

export const caseResearchProfiles = pgTable(
  'case_research_profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    caseId: uuid('case_id')
      .references(() => cases.id, { onDelete: 'cascade' })
      .notNull(),
    researchQuestion: text('research_question'),
    searchKeywords: text('search_keywords'),
    useNotebooklm: boolean('use_notebooklm').default(false).notNull(),
    notebooklmNotebook: varchar('notebooklm_notebook', { length: 500 }),
    notebooklmQuestion: text('notebooklm_question'),
    useVectorDb: boolean('use_vector_db').default(false).notNull(),
    vectorCollections: text('vector_collections'),
    vectorQuery: text('vector_query'),
    vectorTopK: integer('vector_top_k').default(5).notNull(),
    useYargiMcp: boolean('use_yargi_mcp').default(true).notNull(),
    yargiQuery: text('yargi_query'),
    yargiCourtTypes: varchar('yargi_court_types', { length: 500 }),
    yargiChamber: varchar('yargi_chamber', { length: 50 }),
    yargiDateStart: date('yargi_date_start'),
    yargiDateEnd: date('yargi_date_end'),
    yargiResultLimit: integer('yargi_result_limit').default(5).notNull(),
    useMevzuatMcp: boolean('use_mevzuat_mcp').default(true).notNull(),
    mevzuatQuery: text('mevzuat_query'),
    mevzuatScope: text('mevzuat_scope'),
    mevzuatLawNumbers: varchar('mevzuat_law_numbers', { length: 500 }),
    mevzuatResultLimit: integer('mevzuat_result_limit').default(5).notNull(),
    lastRunAt: timestamp('last_run_at'),
    lastRunStatus: researchRunStatusEnum('last_run_status').default('idle').notNull(),
    lastRunSummary: text('last_run_summary'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    caseIdx: uniqueIndex('case_research_profiles_case_idx').on(table.caseId),
  })
)

// ─── Case Procedure Reports (Usul Raporları) ────────────────────────────────

export const caseProcedureReports = pgTable(
  'case_procedure_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    caseId: uuid('case_id')
      .references(() => cases.id, { onDelete: 'cascade' })
      .notNull(),
    courtType: varchar('court_type', { length: 255 }),
    jurisdiction: varchar('jurisdiction', { length: 500 }),
    arbitrationRequired: boolean('arbitration_required'),
    arbitrationBasis: varchar('arbitration_basis', { length: 500 }),
    statuteOfLimitations: text('statute_of_limitations'),
    courtFees: text('court_fees'),
    specialPowerOfAttorney: boolean('special_power_of_attorney'),
    specialPowerOfAttorneyNote: text('special_power_of_attorney_note'),
    precheckPassed: boolean('precheck_passed').default(false).notNull(),
    precheckNotes: text('precheck_notes'),
    reportMarkdown: text('report_markdown'),
    storagePath: varchar('storage_path', { length: 1000 }),
    status: procedureStatusEnum('status').default('not_started').notNull(),
    approvedBy: uuid('approved_by').references(() => users.id, { onDelete: 'set null' }),
    approvedAt: timestamp('approved_at'),
    rejectionNotes: text('rejection_notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    caseIdx: uniqueIndex('case_procedure_reports_case_idx').on(table.caseId),
  })
)

// ─── Drizzle ilişki tipleri için ──────────────────────────────────────────────

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Client = typeof clients.$inferSelect
export type NewClient = typeof clients.$inferInsert
export type Case = typeof cases.$inferSelect
export type NewCase = typeof cases.$inferInsert
export type CaseHearing = typeof caseHearings.$inferSelect
export type NewCaseHearing = typeof caseHearings.$inferInsert
export type Task = typeof tasks.$inferSelect
export type NewTask = typeof tasks.$inferInsert
export type Expense = typeof expenses.$inferSelect
export type NewExpense = typeof expenses.$inferInsert
export type Collection = typeof collections.$inferSelect
export type NewCollection = typeof collections.$inferInsert
export type Notification = typeof notifications.$inferSelect
export type NewNotification = typeof notifications.$inferInsert
export type Document = typeof documents.$inferSelect
export type NewDocument = typeof documents.$inferInsert
export type Note = typeof notes.$inferSelect
export type NewNote = typeof notes.$inferInsert
export type AiJob = typeof aiJobs.$inferSelect
export type NewAiJob = typeof aiJobs.$inferInsert
export type AiJobStep = typeof aiJobSteps.$inferSelect
export type NewAiJobStep = typeof aiJobSteps.$inferInsert
export type AiJobArtifact = typeof aiJobArtifacts.$inferSelect
export type NewAiJobArtifact = typeof aiJobArtifacts.$inferInsert
export type AiJobReview = typeof aiJobReviews.$inferSelect
export type NewAiJobReview = typeof aiJobReviews.$inferInsert
export type AiJobSource = typeof aiJobSources.$inferSelect
export type NewAiJobSource = typeof aiJobSources.$inferInsert
export type CaseIntakeProfile = typeof caseIntakeProfiles.$inferSelect
export type NewCaseIntakeProfile = typeof caseIntakeProfiles.$inferInsert
export type CaseBriefing = typeof caseBriefings.$inferSelect
export type NewCaseBriefing = typeof caseBriefings.$inferInsert
export type CaseResearchProfile = typeof caseResearchProfiles.$inferSelect
export type NewCaseResearchProfile = typeof caseResearchProfiles.$inferInsert
export type CaseProcedureReport = typeof caseProcedureReports.$inferSelect
export type NewCaseProcedureReport = typeof caseProcedureReports.$inferInsert
