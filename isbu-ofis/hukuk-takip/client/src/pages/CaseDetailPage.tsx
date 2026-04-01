import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  useCase,
  useCaseHearings,
  useCaseTasks,
  useCaseExpenses,
  useCaseCollections,
  useCaseNotes,
  useCaseDocuments,
  useDeleteCase,
  useInitializeCaseWorkspace,
  useCreateExpense,
  useDeleteExpense,
  useCreateCollection,
  useDeleteCollection,
  useCreateDocument,
  useDeleteDocument,
} from '@/hooks/useCases'
import { useCaseAiJobs, useCreateAiJob, useRunAiJobStep } from '@/hooks/useAiJobs'
import {
  useApproveCaseBriefing,
  useApproveCaseIntakeProfile,
  useCaseBriefing,
  useCaseIntakeProfile,
  useGenerateCaseBriefing,
  useGenerateCriticalPoint,
  useUpdateCaseIntakeProfile,
} from '@/hooks/useIntake'
import {
  useCaseResearchProfile,
  useCaseResearchQc,
} from '@/hooks/useResearch'
import {
  useCaseProcedureReport,
  useRunProcedurePrecheck,
  useGenerateProcedureReport,
  useReviewProcedureReport,
} from '@/hooks/useProcedure'
import {
  useCaseDefenseSimulation,
  useGenerateDefenseSimulation,
  useReviewDefenseSimulation,
} from '@/hooks/useDefenseSimulation'
import {
  useCasePleading,
  useExportPleadingUdf,
  useFinalReviewPleading,
  useGeneratePleading,
  useReviewPleading,
  useRevisePleading,
  useUpdatePleadingDraft,
} from '@/hooks/usePleading'
import { useCreateNote, useDeleteNote } from '@/hooks/useNotes'
import { useCreateHearing, useDeleteHearing } from '@/hooks/useHearings'
import { useCreateTask } from '@/hooks/useTasks'
import {
  formatDate,
  formatDateTime,
  formatRelativeDate,
  formatCurrency,
  formatFileSize,
  isOverdue,
  automationStatusLabels,
  caseStatusLabels,
  caseTypeLabels,
  taskPriorityLabels,
  taskStatusLabels,
  hearingResultLabels,
  expenseTypeLabels,
} from '@/lib/utils'
import {
  DOCUMENT_ACCEPT_ATTRIBUTE,
  DOCUMENT_UPLOAD_HELP_TEXT,
  MAX_DOCUMENT_UPLOAD_FILES,
  MAX_DOCUMENT_UPLOAD_SIZE_MB,
  getDocumentTypeLabel,
} from '@/lib/documents'
import { AiWorkspaceTab } from '@/components/shared'
import ResearchTab from '@/components/research/ResearchTab'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowLeft,
  Edit,
  Trash2,
  CalendarClock,
  ListChecks,
  Banknote,
  CreditCard,
  StickyNote,
  User,
  Building2,
  Bot,
  Calendar,
  FolderOpen,
  FileText,
  AlertTriangle,
  Send,
  Loader2,
  Plus,
  X,
  Search,
  Scale,
  ScrollText,
  Shield,
  Download,
  Sparkles,
} from 'lucide-react'

const statusVariant: Record<string, 'default' | 'success' | 'danger' | 'warning' | 'secondary'> = {
  active: 'default', won: 'success', lost: 'danger', settled: 'warning', closed: 'secondary', passive: 'secondary',
  istinafta: 'warning', 'yargıtayda': 'warning',
}
const priorityVariant: Record<string, 'danger' | 'warning' | 'secondary' | 'outline'> = {
  urgent: 'danger', high: 'warning', medium: 'secondary', low: 'outline',
}
const taskStatusVariant: Record<string, 'warning' | 'default' | 'success' | 'secondary'> = {
  pending: 'warning', in_progress: 'default', completed: 'success', cancelled: 'secondary',
}

const aiJobStatusLabels: Record<string, string> = {
  draft: 'Taslak',
  queued: 'Sırada',
  in_progress: 'Çalışıyor',
  review_required: 'Review Bekliyor',
  completed: 'Tamamlandı',
  failed: 'Hata',
  cancelled: 'İptal',
}

const aiJobStatusVariant: Record<string, 'default' | 'success' | 'danger' | 'warning' | 'secondary'> = {
  draft: 'secondary',
  queued: 'warning',
  in_progress: 'default',
  review_required: 'warning',
  completed: 'success',
  failed: 'danger',
  cancelled: 'secondary',
}

const aiJobTypeLabels: Record<string, string> = {
  intake: 'Intake',
  briefing: 'Briefing',
  procedure: 'Usul',
  research: 'Araştırma',
  pleading: 'Dilekçe',
  udf: 'UDF',
}

type TabId =
  | 'ai_workspace'
  | 'hearings'
  | 'tasks'
  | 'expenses'
  | 'collections'
  | 'procedure'
  | 'research'
  | 'pleading'
  | 'defense'
  | 'documents'
  | 'notes'

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'ai_workspace', label: 'AI Workspace', icon: Sparkles },
  { id: 'hearings', label: 'Duruşmalar', icon: CalendarClock },
  { id: 'tasks', label: 'Görevler', icon: ListChecks },
  { id: 'expenses', label: 'Masraflar', icon: Banknote },
  { id: 'collections', label: 'Tahsilatlar', icon: CreditCard },
  { id: 'procedure', label: 'Usul', icon: Scale },
  { id: 'research', label: 'Araştırma', icon: Bot },
  { id: 'pleading', label: 'Dilekçe', icon: ScrollText },
  { id: 'defense', label: 'Savunma', icon: Shield },
  { id: 'documents', label: 'Belgeler', icon: FileText },
  { id: 'notes', label: 'Notlar', icon: StickyNote },
]

export default function CaseDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState<TabId>('ai_workspace')

  const [noteContent, setNoteContent] = useState('')

  // Form visibility states
  const [showHearingForm, setShowHearingForm] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [showCollectionForm, setShowCollectionForm] = useState(false)

  // Hearing form state
  const [hearingDate, setHearingDate] = useState('')
  const [hearingTime, setHearingTime] = useState('09:00')
  const [hearingRoom, setHearingRoom] = useState('')
  const [hearingNotes, setHearingNotes] = useState('')

  // Task form state
  const [taskTitle, setTaskTitle] = useState('')
  const [taskPriority, setTaskPriority] = useState('medium')
  const [taskDueDate, setTaskDueDate] = useState('')

  // Expense form state
  const [expenseDesc, setExpenseDesc] = useState('')
  const [expenseType, setExpenseType] = useState('court_fee')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0])

  // Collection form state
  const [collectionAmount, setCollectionAmount] = useState('')
  const [collectionDate, setCollectionDate] = useState(new Date().toISOString().split('T')[0])
  const [collectionDesc, setCollectionDesc] = useState('')
  const [collectionMethod, setCollectionMethod] = useState('bank_transfer')
  const [showDocumentForm, setShowDocumentForm] = useState(false)
  const [documentFiles, setDocumentFiles] = useState<File[]>([])
  const [documentDescription, setDocumentDescription] = useState('')
  const [lawyerDirection, setLawyerDirection] = useState('')
  const [clientInterviewNotes, setClientInterviewNotes] = useState('')
  const [criticalPointSummaryDraft, setCriticalPointSummaryDraft] = useState('')
  const [mainLegalAxisDraft, setMainLegalAxisDraft] = useState('')
  const [secondaryRisksDraft, setSecondaryRisksDraft] = useState('')
  const [proofRisksDraft, setProofRisksDraft] = useState('')
  const [missingInformationDraft, setMissingInformationDraft] = useState('')
  const [missingDocumentsDraft, setMissingDocumentsDraft] = useState('')
  const [opponentArgumentsDraft, setOpponentArgumentsDraft] = useState('')
  const [briefingToneStrategy, setBriefingToneStrategy] = useState('')
  const [researchQuestion, setResearchQuestion] = useState('')
  const [researchKeywords, setResearchKeywords] = useState('')
  const [useNotebooklm, setUseNotebooklm] = useState(false)
  const [notebooklmNotebook, setNotebooklmNotebook] = useState('')
  const [notebooklmQuestion, setNotebooklmQuestion] = useState('')
  const [useVectorDb, setUseVectorDb] = useState(false)
  const [vectorCollections, setVectorCollections] = useState('')
  const [vectorQuery, setVectorQuery] = useState('')
  const [vectorTopK, setVectorTopK] = useState('5')
  const [useYargiMcp, setUseYargiMcp] = useState(true)
  const [yargiQuery, setYargiQuery] = useState('')
  const [yargiCourtTypes, setYargiCourtTypes] = useState('YARGITAYKARARI,ISTINAFHUKUK')
  const [yargiChamber, setYargiChamber] = useState('')
  const [yargiDateStart, setYargiDateStart] = useState('')
  const [yargiDateEnd, setYargiDateEnd] = useState('')
  const [yargiResultLimit, setYargiResultLimit] = useState('3')
  const [useMevzuatMcp, setUseMevzuatMcp] = useState(true)
  const [mevzuatQuery, setMevzuatQuery] = useState('')
  const [mevzuatScope, setMevzuatScope] = useState('')
  const [mevzuatLawNumbers, setMevzuatLawNumbers] = useState('')
  const [mevzuatResultLimit, setMevzuatResultLimit] = useState('3')
  const [latestResearchRun, setLatestResearchRun] = useState<any | null>(null)
  const [researchReviewNotes, setResearchReviewNotes] = useState('')
  const [pleadingReviewNotes, setPleadingReviewNotes] = useState('')
  const [pleadingEditMode, setPleadingEditMode] = useState(false)
  const [pleadingEditContent, setPleadingEditContent] = useState('')
  const [defenseReviewNotes, setDefenseReviewNotes] = useState('')
  const [finalReviewNotes, setFinalReviewNotes] = useState('')

  const { data: caseData, isLoading, isError } = useCase(id)
  const { data: hearingsData } = useCaseHearings(id)
  const { data: tasksData } = useCaseTasks(id)
  const { data: expensesData } = useCaseExpenses(id)
  const { data: collectionsData } = useCaseCollections(id)
  const { data: documentsData } = useCaseDocuments(id)
  const { data: notesData } = useCaseNotes(id)
  const { data: aiJobsData } = useCaseAiJobs(id)
  const { data: intakeProfileData } = useCaseIntakeProfile(id)
  const { data: briefingData } = useCaseBriefing(id)
  const { data: researchProfileData } = useCaseResearchProfile(id)
  const { data: procedureData } = useCaseProcedureReport(id)
  const { data: pleadingData } = useCasePleading(id)
  const generatePleading = useGeneratePleading(id)
  const reviewPleading = useReviewPleading(id)
  const updatePleadingDraft = useUpdatePleadingDraft(id)
  const revisePleading = useRevisePleading(id)
  const finalReviewPleading = useFinalReviewPleading(id)
  const exportUdf = useExportPleadingUdf(id)
  const { data: defenseData } = useCaseDefenseSimulation(id)
  const generateDefense = useGenerateDefenseSimulation(id)
  const reviewDefense = useReviewDefenseSimulation(id)
  const deleteCase = useDeleteCase()
  const initializeWorkspace = useInitializeCaseWorkspace(id || '')
  const createNote = useCreateNote()
  const deleteNote = useDeleteNote()

  const createHearing = useCreateHearing()
  const deleteHearing = useDeleteHearing()
  const createTask = useCreateTask()
  const createExpense = useCreateExpense()
  const deleteExpense = useDeleteExpense()
  const createCollection = useCreateCollection()
  const deleteCollection = useDeleteCollection()
  const createDocument = useCreateDocument()
  const deleteDocument = useDeleteDocument(id)
  const createAiJob = useCreateAiJob(id)
  const runAiJobStep = useRunAiJobStep(id)
  const updateCaseIntakeProfile = useUpdateCaseIntakeProfile(id)
  const generateCriticalPoint = useGenerateCriticalPoint(id)
  const approveCaseIntakeProfile = useApproveCaseIntakeProfile(id)
  const generateCaseBriefing = useGenerateCaseBriefing(id)
  const approveCaseBriefing = useApproveCaseBriefing(id)
  const { data: researchQcData } = useCaseResearchQc(id)
  const runProcedurePrecheck = useRunProcedurePrecheck(id)
  const generateProcedureReport = useGenerateProcedureReport(id)
  const reviewProcedureReport = useReviewProcedureReport(id)

  const hearings = hearingsData?.hearings || hearingsData || []
  const tasks = tasksData?.tasks || tasksData || []
  const expenses = expensesData?.expenses || expensesData || []
  const collections = collectionsData?.collections || collectionsData || []
  const documents = documentsData?.documents || documentsData || []
  const notes = notesData?.notes || notesData || []
  const aiJobs = aiJobsData?.jobs || aiJobsData || []
  const intakeProfile = intakeProfileData?.profile || null
  const briefing = briefingData?.briefing || null
  const researchProfile = researchProfileData?.profile || null

  useEffect(() => {
    if (!intakeProfile) {
      return
    }

    setLawyerDirection(intakeProfile.lawyerDirection || '')
    setClientInterviewNotes(intakeProfile.clientInterviewNotes || '')
    setCriticalPointSummaryDraft(intakeProfile.criticalPointSummary || '')
    setMainLegalAxisDraft(intakeProfile.mainLegalAxis || '')
    setSecondaryRisksDraft(intakeProfile.secondaryRisks || '')
    setProofRisksDraft(intakeProfile.proofRisks || '')
    setMissingInformationDraft(intakeProfile.missingInformation || '')
    setMissingDocumentsDraft(intakeProfile.missingDocuments || '')
    setOpponentArgumentsDraft(intakeProfile.opponentInitialArguments || '')
  }, [intakeProfile])

  useEffect(() => {
    if (!briefing) {
      return
    }

    setBriefingToneStrategy(briefing.toneStrategy || '')
  }, [briefing])

  useEffect(() => {
    if (!researchProfile) {
      return
    }

    // Araştırma sorusu boşsa, kritik nokta / briefing / açıklamadan otomatik doldur
    const effectiveQuestion = researchProfile.researchQuestion
      || intakeProfile?.criticalPointSummary
      || briefing?.summary
      || caseData?.description
      || ''
    setResearchQuestion(effectiveQuestion)
    setResearchKeywords(researchProfile.searchKeywords || '')
    setUseNotebooklm(!!researchProfile.useNotebooklm)
    setNotebooklmNotebook(researchProfile.notebooklmNotebook || '')
    setNotebooklmQuestion(researchProfile.notebooklmQuestion || '')
    setUseVectorDb(!!researchProfile.useVectorDb)
    setVectorCollections(researchProfile.vectorCollections || '')
    setVectorQuery(researchProfile.vectorQuery || '')
    setVectorTopK(String(researchProfile.vectorTopK || 5))
    setUseYargiMcp(researchProfile.useYargiMcp ?? true)
    setYargiQuery(researchProfile.yargiQuery || '')
    setYargiCourtTypes(researchProfile.yargiCourtTypes || 'YARGITAYKARARI,ISTINAFHUKUK')
    setYargiChamber(researchProfile.yargiChamber || '')
    setYargiDateStart(researchProfile.yargiDateStart || '')
    setYargiDateEnd(researchProfile.yargiDateEnd || '')
    setYargiResultLimit(String(researchProfile.yargiResultLimit || 3))
    setUseMevzuatMcp(researchProfile.useMevzuatMcp ?? true)
    setMevzuatQuery(researchProfile.mevzuatQuery || '')
    setMevzuatScope(researchProfile.mevzuatScope || '')
    setMevzuatLawNumbers(researchProfile.mevzuatLawNumbers || '')
    setMevzuatResultLimit(String(researchProfile.mevzuatResultLimit || 3))
  }, [researchProfile])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-48 lg:col-span-1" />
          <Skeleton className="h-48 lg:col-span-2" />
        </div>
      </div>
    )
  }

  if (isError || !caseData) {
    return (
      <div className="space-y-6">
        <button onClick={() => navigate('/cases')} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Davalara dön
        </button>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 p-6">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-700">Dava bulunamadı.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalExpenses = expenses.reduce((sum: number, e: any) => sum + parseFloat(e.amount || '0'), 0)
  const totalCollections = collections.reduce((sum: number, c: any) => sum + parseFloat(c.amount || '0'), 0)
  const balance = totalCollections - totalExpenses
  const selectedDocumentTotalSize = documentFiles.reduce((sum, file) => sum + file.size, 0)
  const activeAiJobCount = aiJobs.filter(
    (job: any) => !['completed', 'cancelled', 'failed'].includes(job.status)
  ).length
  const pendingAiReviewCount = aiJobs.reduce(
    (sum: number, job: any) =>
      sum +
      (Array.isArray(job.reviews)
        ? job.reviews.filter((review: any) => review.status === 'pending').length
        : 0),
    0
  )
  const totalArtifacts = aiJobs.reduce(
    (sum: number, job: any) => sum + (Array.isArray(job.artifacts) ? job.artifacts.length : 0),
    0
  )

  const appendSelectedFiles = (fileList: FileList | null) => {
    if (!fileList) return

    setDocumentFiles((currentFiles) => {
      const nextFiles = [...currentFiles]

      for (const file of Array.from(fileList)) {
        const duplicateExists = nextFiles.some(
          (currentFile) =>
            currentFile.name === file.name &&
            currentFile.size === file.size &&
            currentFile.lastModified === file.lastModified
        )

        if (!duplicateExists) {
          nextFiles.push(file)
        }
      }

      return nextFiles.slice(0, MAX_DOCUMENT_UPLOAD_FILES)
    })
  }

  const removeSelectedDocument = (targetFile: File) => {
    setDocumentFiles((currentFiles) =>
      currentFiles.filter(
        (file) =>
          !(
            file.name === targetFile.name &&
            file.size === targetFile.size &&
            file.lastModified === targetFile.lastModified
          )
      )
    )
  }

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate('/cases')}
            className="mt-1 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="page-title">{caseData.title}</h1>
              <Badge variant={statusVariant[caseData.status] || 'secondary'}>
                {caseStatusLabels[caseData.status] || caseData.status}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {caseTypeLabels[caseData.caseType] || caseData.caseType}
              {caseData.caseNumber && ` · Esas: ${caseData.caseNumber}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/cases/${id}/edit`)}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Edit className="h-4 w-4" />
            Düzenle
          </button>
          <button
            onClick={() => {
              if (confirm('Bu davayı silmek istediğinize emin misiniz?')) {
                deleteCase.mutate(caseData.id, { onSuccess: () => navigate('/cases') })
              }
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Sil
          </button>
        </div>
      </div>

      {/* Üst Bilgi Kartları */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <User className="h-5 w-5 text-law-accent" />
            <div>
              <p className="text-xs text-muted-foreground">Müvekkil</p>
              <p
                className="cursor-pointer text-sm font-medium hover:text-law-accent"
                onClick={() => navigate(`/clients/${caseData.clientId}`)}
              >
                {caseData.clientName || '—'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Building2 className="h-5 w-5 text-law-accent" />
            <div>
              <p className="text-xs text-muted-foreground">Mahkeme</p>
              <p className="text-sm font-medium">{caseData.courtName || '—'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Calendar className="h-5 w-5 text-law-accent" />
            <div>
              <p className="text-xs text-muted-foreground">Başlangıç</p>
              <p className="text-sm font-medium">{formatDate(caseData.startDate)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Banknote className="h-5 w-5 text-law-accent" />
            <div>
              <p className="text-xs text-muted-foreground">Bakiye</p>
              <p className={`text-sm font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(balance)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-law-accent/20 bg-law-accent/5">
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-law-accent" />
              <div>
                <p className="text-sm font-semibold text-law-primary">AI Workspace</p>
                <p className="text-xs text-muted-foreground">
                  Drive klasoru ve otomasyon artefakt baglantilari
                </p>
              </div>
            </div>
            <Badge variant={caseData.automationStatus === 'completed' ? 'success' : 'secondary'}>
              {automationStatusLabels[caseData.automationStatus] || caseData.automationStatus || 'Baslanmadi'}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={initializeWorkspace.isPending}
              onClick={() => initializeWorkspace.mutate()}
              className="inline-flex items-center gap-2 rounded-lg bg-law-accent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8] disabled:opacity-50"
            >
              {initializeWorkspace.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
              AI ile Dava Baslat
            </button>
            <p className="text-xs text-muted-foreground">
              Drive klasoru, temel dosyalar, ilk gorevler ve AI notu hazirlanir.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Otomasyon Dava Kodu
                </p>
                <p className="mt-1 text-sm font-medium">
                  {caseData.automationCaseCode || 'Tanimlanmadi'}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Drive Klasörü
                </p>
                <div className="flex items-start gap-2 rounded-lg border bg-card/80 p-3">
                  <FolderOpen className="mt-0.5 h-4 w-4 text-law-accent" />
                  <code className="break-all text-xs">
                    {caseData.driveFolderPath || 'Henüz bağlanmadı'}
                  </code>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Briefing
                </p>
                <div className="flex items-start gap-2 rounded-lg border bg-card/80 p-3">
                  <FileText className="mt-0.5 h-4 w-4 text-law-accent" />
                  <code className="break-all text-xs">{caseData.briefingPath || 'Henüz yok'}</code>
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Usul
                </p>
                <div className="flex items-start gap-2 rounded-lg border bg-card/80 p-3">
                  <FileText className="mt-0.5 h-4 w-4 text-law-accent" />
                  <code className="break-all text-xs">{caseData.procedurePath || 'Henüz yok'}</code>
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Araştırma
                </p>
                <div className="flex items-start gap-2 rounded-lg border bg-card/80 p-3">
                  <FileText className="mt-0.5 h-4 w-4 text-law-accent" />
                  <code className="break-all text-xs">{caseData.researchPath || 'Henüz yok'}</code>
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Savunma Simülasyonu
                </p>
                <div className="flex items-start gap-2 rounded-lg border bg-card/80 p-3">
                  <FileText className="mt-0.5 h-4 w-4 text-law-accent" />
                  <code className="break-all text-xs">
                    {caseData.defenseSimulationPath || 'Henüz yok'}
                  </code>
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Revizyon
                </p>
                <div className="flex items-start gap-2 rounded-lg border bg-card/80 p-3">
                  <FileText className="mt-0.5 h-4 w-4 text-law-accent" />
                  <code className="break-all text-xs">{caseData.revisionPath || 'Henüz yok'}</code>
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Dilekçe Çıktıları
                </p>
                <div className="space-y-2 rounded-lg border bg-card/80 p-3">
                  <code className="block break-all text-xs">
                    MD: {caseData.pleadingMdPath || 'Henüz yok'}
                  </code>
                  <code className="block break-all text-xs">
                    UDF: {caseData.pleadingUdfPath || 'Henüz yok'}
                  </code>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Açıklama */}
      {caseData.description && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm whitespace-pre-wrap text-muted-foreground">{caseData.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Sekmeler */}
      <div>
        <div className="flex gap-1 overflow-x-auto border-b">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-law-accent text-law-accent'
                    : 'border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-law-accent' : ''}`} />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="mt-4">
          {/* AI Workspace */}
          {activeTab === 'ai_workspace' && caseData?.case && (
            <AiWorkspaceTab
              caseData={caseData.case}
              briefing={briefing}
              procedureData={procedureData}
              researchQcData={researchQcData}
              researchApproved={caseData.case.automationStatus !== 'not_started' && caseData.case.automationStatus !== 'folder_ready' && caseData.case.automationStatus !== 'briefing_ready' && ['draft_ready', 'review_ready', 'completed'].includes(caseData.case.automationStatus)}
              pleadingData={pleadingData}
              defenseData={defenseData}
              onNavigateTab={(tab) => setActiveTab(tab as TabId)}
              onExportUdf={() => exportUdf.mutate()}
              exportUdfPending={exportUdf.isPending}
            />
          )}

          {/* Duruşmalar */}
          {activeTab === 'hearings' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowHearingForm(!showHearingForm)}
                  className="inline-flex items-center gap-2 rounded-lg bg-law-accent px-3 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]"
                >
                  {showHearingForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {showHearingForm ? 'İptal' : 'Duruşma Ekle'}
                </button>
              </div>
              {showHearingForm && (
                <Card className="border-law-accent/30 bg-law-accent/5">
                  <CardContent className="p-4">
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      if (!hearingDate) return
                      const dateTimeStr = `${hearingDate}T${hearingTime}:00`
                      createHearing.mutate(
                        { caseId: id!, hearingDate: dateTimeStr, courtRoom: hearingRoom, notes: hearingNotes } as any,
                        { onSuccess: () => { setShowHearingForm(false); setHearingDate(''); setHearingRoom(''); setHearingNotes('') } }
                      )
                    }} className="space-y-3">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium">Tarih *</label>
                          <input type="date" value={hearingDate} onChange={e => setHearingDate(e.target.value)} required
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-law-accent" />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium">Saat</label>
                          <input type="time" value={hearingTime} onChange={e => setHearingTime(e.target.value)}
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-law-accent" />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium">Salon</label>
                          <input type="text" value={hearingRoom} onChange={e => setHearingRoom(e.target.value)} placeholder="A-101"
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-law-accent" />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium">Notlar</label>
                        <input type="text" value={hearingNotes} onChange={e => setHearingNotes(e.target.value)} placeholder="Duruşma notları..."
                          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-law-accent" />
                      </div>
                      <div className="flex justify-end">
                        <button type="submit" disabled={createHearing.isPending || !hearingDate}
                          className="inline-flex items-center gap-2 rounded-lg bg-law-accent px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50">
                          Ekle
                        </button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardContent className="p-0">
                  {hearings.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-center">
                      <CalendarClock className="mb-2 h-8 w-8 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">Duruşma kaydı bulunmuyor</p>
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          <th className="px-4 py-3">Tarih</th>
                          <th className="hidden px-4 py-3 sm:table-cell">Mahkeme / Salon</th>
                          <th className="px-4 py-3">Sonuç</th>
                          <th className="hidden px-4 py-3 md:table-cell">Notlar</th>
                          <th className="px-4 py-3"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {hearings.map((h: any) => (
                          <tr key={h.id} className="hover:bg-muted/50">
                            <td className="px-4 py-3">
                              <p className={`font-medium ${isOverdue(h.hearingDate) && h.result === 'pending' ? 'text-red-600' : ''}`}>
                                {formatDateTime(h.hearingDate)}
                              </p>
                              <p className="text-xs text-muted-foreground">{formatRelativeDate(h.hearingDate)}</p>
                            </td>
                            <td className="hidden px-4 py-3 sm:table-cell">
                              <p className="text-muted-foreground">{h.courtName || caseData.courtName || '—'}</p>
                              {h.courtRoom && <p className="text-xs text-muted-foreground">Salon: {h.courtRoom}</p>}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={h.result === 'completed' ? 'success' : h.result === 'postponed' ? 'warning' : h.result === 'cancelled' ? 'danger' : 'secondary'}>
                                {hearingResultLabels[h.result] || h.result || 'Beklemede'}
                              </Badge>
                            </td>
                            <td className="hidden max-w-[200px] truncate px-4 py-3 md:table-cell">
                              <span className="text-xs text-muted-foreground">{h.notes || '—'}</span>
                            </td>
                            <td className="px-4 py-3">
                              <button onClick={() => { if (confirm('Bu duruşmayı silmek istediğinize emin misiniz?')) deleteHearing.mutate(h.id) }}
                                className="rounded p-1 text-muted-foreground/40 hover:bg-red-50 hover:text-red-600">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Görevler */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowTaskForm(!showTaskForm)}
                  className="inline-flex items-center gap-2 rounded-lg bg-law-accent px-3 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]"
                >
                  {showTaskForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {showTaskForm ? 'İptal' : 'Görev Ekle'}
                </button>
              </div>
              {showTaskForm && (
                <Card className="border-law-accent/30 bg-law-accent/5">
                  <CardContent className="p-4">
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      if (!taskTitle.trim()) return
                      createTask.mutate(
                        { title: taskTitle, caseId: id, priority: taskPriority as any, dueDate: taskDueDate || '' },
                        { onSuccess: () => { setShowTaskForm(false); setTaskTitle(''); setTaskPriority('medium'); setTaskDueDate('') } }
                      )
                    }} className="space-y-3">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="sm:col-span-1">
                          <label className="mb-1 block text-xs font-medium">Görev Başlığı *</label>
                          <input type="text" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} required placeholder="Görev başlığı..." autoFocus
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-law-accent" />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium">Öncelik</label>
                          <select value={taskPriority} onChange={e => setTaskPriority(e.target.value)}
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-law-accent">
                            <option value="low">Düşük</option>
                            <option value="medium">Orta</option>
                            <option value="high">Yüksek</option>
                            <option value="urgent">Acil</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium">Son Tarih</label>
                          <input type="date" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)}
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-law-accent" />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button type="submit" disabled={createTask.isPending || !taskTitle.trim()}
                          className="inline-flex items-center gap-2 rounded-lg bg-law-accent px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50">
                          Ekle
                        </button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardContent className="p-0">
                  {tasks.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-center">
                      <ListChecks className="mb-2 h-8 w-8 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">Görev bulunmuyor</p>
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          <th className="px-4 py-3">Görev</th>
                          <th className="px-4 py-3">Öncelik</th>
                          <th className="px-4 py-3">Durum</th>
                          <th className="hidden px-4 py-3 sm:table-cell">Son Tarih</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {tasks.map((t: any) => (
                          <tr key={t.id} className="hover:bg-muted/50">
                            <td className="px-4 py-3">
                              <p className="font-medium">{t.title}</p>
                              {t.description && <p className="max-w-[200px] truncate text-xs text-muted-foreground">{t.description}</p>}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={priorityVariant[t.priority] || 'outline'}>{taskPriorityLabels[t.priority] || t.priority}</Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={taskStatusVariant[t.status] || 'secondary'}>{taskStatusLabels[t.status] || t.status}</Badge>
                            </td>
                            <td className="hidden px-4 py-3 sm:table-cell">
                              {t.dueDate ? (
                                <span className={`text-xs ${isOverdue(t.dueDate) && t.status !== 'completed' ? 'font-medium text-red-600' : 'text-muted-foreground'}`}>
                                  {formatDate(t.dueDate)}
                                </span>
                              ) : <span className="text-xs text-muted-foreground/50">—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Masraflar */}
          {activeTab === 'expenses' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowExpenseForm(!showExpenseForm)}
                  className="inline-flex items-center gap-2 rounded-lg bg-law-accent px-3 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]"
                >
                  {showExpenseForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {showExpenseForm ? 'İptal' : 'Masraf Ekle'}
                </button>
              </div>
              {showExpenseForm && (
                <Card className="border-law-accent/30 bg-law-accent/5">
                  <CardContent className="p-4">
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      if (!expenseDesc.trim() || !expenseAmount) return
                      createExpense.mutate(
                        { caseId: id!, type: expenseType as any, description: expenseDesc, amount: expenseAmount, expenseDate, currency: 'TRY', isBillable: true },
                        { onSuccess: () => { setShowExpenseForm(false); setExpenseDesc(''); setExpenseAmount(''); setExpenseType('court_fee'); setExpenseDate(new Date().toISOString().split('T')[0]) } }
                      )
                    }} className="space-y-3">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-xs font-medium">Açıklama *</label>
                          <input type="text" value={expenseDesc} onChange={e => setExpenseDesc(e.target.value)} required placeholder="Masraf açıklaması..."
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-law-accent" />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium">Tür</label>
                          <select value={expenseType} onChange={e => setExpenseType(e.target.value)}
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-law-accent">
                            <option value="court_fee">Mahkeme Harcı</option>
                            <option value="notary">Noter</option>
                            <option value="expert">Bilirkişi</option>
                            <option value="travel">Ulaşım</option>
                            <option value="document">Evrak</option>
                            <option value="other">Diğer</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium">Tutar (₺) *</label>
                          <input type="number" step="0.01" min="0" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} required placeholder="0.00"
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-law-accent" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                        <div>
                          <label className="mb-1 block text-xs font-medium">Tarih *</label>
                          <input type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} required
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-law-accent" />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button type="submit" disabled={createExpense.isPending || !expenseDesc.trim() || !expenseAmount}
                          className="inline-flex items-center gap-2 rounded-lg bg-law-accent px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50">
                          Ekle
                        </button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardContent className="p-0">
                  {expenses.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-center">
                      <Banknote className="mb-2 h-8 w-8 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">Masraf kaydı bulunmuyor</p>
                    </div>
                  ) : (
                    <>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/30 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            <th className="px-4 py-3">Açıklama</th>
                            <th className="px-4 py-3">Tür</th>
                            <th className="hidden px-4 py-3 sm:table-cell">Tarih</th>
                            <th className="px-4 py-3 text-right">Tutar</th>
                            <th className="px-4 py-3"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {expenses.map((e: any) => (
                            <tr key={e.id} className="hover:bg-muted/50">
                              <td className="px-4 py-3 font-medium">{e.description || '—'}</td>
                              <td className="px-4 py-3 text-muted-foreground">{expenseTypeLabels[e.type || e.expenseType] || e.type || e.expenseType}</td>
                              <td className="hidden px-4 py-3 sm:table-cell text-xs text-muted-foreground">{formatDate(e.expenseDate)}</td>
                              <td className="px-4 py-3 text-right font-medium text-red-600">{formatCurrency(e.amount)}</td>
                              <td className="px-4 py-3">
                                <button onClick={() => { if (confirm('Bu masrafı silmek istediğinize emin misiniz?')) deleteExpense.mutate(e.id) }}
                                  className="rounded p-1 text-muted-foreground/40 hover:bg-red-50 hover:text-red-600">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="border-t bg-muted/20 px-4 py-3 text-right">
                        <span className="text-sm font-bold text-red-600">Toplam Masraf: {formatCurrency(totalExpenses)}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tahsilatlar */}
          {activeTab === 'collections' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowCollectionForm(!showCollectionForm)}
                  className="inline-flex items-center gap-2 rounded-lg bg-law-accent px-3 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]"
                >
                  {showCollectionForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {showCollectionForm ? 'İptal' : 'Tahsilat Ekle'}
                </button>
              </div>
              {showCollectionForm && (
                <Card className="border-law-accent/30 bg-law-accent/5">
                  <CardContent className="p-4">
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      if (!collectionAmount) return
                      createCollection.mutate(
                        { caseId: id!, clientId: caseData.clientId!, amount: collectionAmount, collectionDate, description: collectionDesc, paymentMethod: collectionMethod, currency: 'TRY' },
                        { onSuccess: () => { setShowCollectionForm(false); setCollectionAmount(''); setCollectionDesc(''); setCollectionDate(new Date().toISOString().split('T')[0]); setCollectionMethod('bank_transfer') } }
                      )
                    }} className="space-y-3">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium">Tutar (₺) *</label>
                          <input type="number" step="0.01" min="0" value={collectionAmount} onChange={e => setCollectionAmount(e.target.value)} required placeholder="0.00"
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-law-accent" />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium">Tarih *</label>
                          <input type="date" value={collectionDate} onChange={e => setCollectionDate(e.target.value)} required
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-law-accent" />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium">Ödeme Yöntemi</label>
                          <select value={collectionMethod} onChange={e => setCollectionMethod(e.target.value)}
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-law-accent">
                            <option value="bank_transfer">Banka Havalesi</option>
                            <option value="cash">Nakit</option>
                            <option value="check">Çek</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium">Açıklama</label>
                        <input type="text" value={collectionDesc} onChange={e => setCollectionDesc(e.target.value)} placeholder="Tahsilat açıklaması..."
                          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-law-accent" />
                      </div>
                      <div className="flex justify-end">
                        <button type="submit" disabled={createCollection.isPending || !collectionAmount}
                          className="inline-flex items-center gap-2 rounded-lg bg-law-accent px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50">
                          Ekle
                        </button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardContent className="p-0">
                  {collections.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-center">
                      <CreditCard className="mb-2 h-8 w-8 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">Tahsilat kaydı bulunmuyor</p>
                    </div>
                  ) : (
                    <>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/30 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            <th className="px-4 py-3">Açıklama</th>
                            <th className="hidden px-4 py-3 sm:table-cell">Tarih</th>
                            <th className="px-4 py-3 text-right">Tutar</th>
                            <th className="px-4 py-3"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {collections.map((c: any) => (
                            <tr key={c.id} className="hover:bg-muted/50">
                              <td className="px-4 py-3 font-medium">{c.description || '—'}</td>
                              <td className="hidden px-4 py-3 sm:table-cell text-xs text-muted-foreground">{formatDate(c.collectionDate)}</td>
                              <td className="px-4 py-3 text-right font-medium text-emerald-600">{formatCurrency(c.amount)}</td>
                              <td className="px-4 py-3">
                                <button onClick={() => { if (confirm('Bu tahsilatı silmek istediğinize emin misiniz?')) deleteCollection.mutate(c.id) }}
                                  className="rounded p-1 text-muted-foreground/40 hover:bg-red-50 hover:text-red-600">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="border-t bg-muted/20 px-4 py-3 text-right">
                        <span className="text-sm font-bold text-emerald-600">Toplam Tahsilat: {formatCurrency(totalCollections)}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'procedure' && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <h3 className="mb-4 text-lg font-semibold">Usul Raporu</h3>

                  {(() => {
                    const report = procedureData?.procedureReport
                    const status = report?.status || 'not_started'

                    return (
                      <div className="space-y-4">
                        {/* Durum göstergesi */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Durum:</span>
                          <Badge variant={
                            status === 'approved' ? 'success' :
                            status === 'rejected' ? 'danger' :
                            status === 'draft' ? 'warning' :
                            status === 'generating' ? 'default' :
                            status === 'precheck_done' ? 'secondary' :
                            'outline'
                          }>
                            {status === 'not_started' && 'Başlanmadı'}
                            {status === 'precheck_done' && 'Ön Kontrol Tamam'}
                            {status === 'generating' && 'Oluşturuluyor...'}
                            {status === 'draft' && 'Taslak'}
                            {status === 'approved' && 'Onaylandı'}
                            {status === 'rejected' && 'Reddedildi'}
                          </Badge>
                        </div>

                        {/* Ön kontrol sonuçları */}
                        {report?.precheckNotes && (
                          <div className="rounded-md border p-4">
                            <h4 className="mb-2 text-sm font-medium">Ön Kontrol Sonucu</h4>
                            <div className="grid gap-2 text-sm">
                              {report.courtType && (
                                <div><span className="text-muted-foreground">Görevli Mahkeme:</span> {report.courtType}</div>
                              )}
                              {report.jurisdiction && (
                                <div><span className="text-muted-foreground">Yetkili Yer:</span> {report.jurisdiction}</div>
                              )}
                              {report.arbitrationRequired != null && (
                                <div>
                                  <span className="text-muted-foreground">Arabuluculuk:</span>{' '}
                                  {report.arbitrationRequired ? (
                                    <Badge variant="warning">Zorunlu</Badge>
                                  ) : (
                                    <Badge variant="secondary">Zorunlu Değil</Badge>
                                  )}
                                  {report.arbitrationBasis && <span className="ml-2 text-xs text-muted-foreground">({report.arbitrationBasis})</span>}
                                </div>
                              )}
                              {report.statuteOfLimitations && (
                                <div><span className="text-muted-foreground">Zamanaşımı:</span> {report.statuteOfLimitations}</div>
                              )}
                              {report.specialPowerOfAttorney != null && (
                                <div>
                                  <span className="text-muted-foreground">Özel Vekaletname:</span>{' '}
                                  {report.specialPowerOfAttorney ? (
                                    <span className="font-medium text-amber-600">Gerekli — {report.specialPowerOfAttorneyNote}</span>
                                  ) : (
                                    'Gerekli değil'
                                  )}
                                </div>
                              )}
                              <div className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{report.precheckNotes}</div>
                            </div>
                          </div>
                        )}

                        {/* Rapor içeriği */}
                        {report?.reportMarkdown && (
                          <div className="rounded-md border p-4">
                            <h4 className="mb-2 text-sm font-medium">Usul Raporu</h4>
                            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm">
                              {report.reportMarkdown}
                            </div>
                          </div>
                        )}

                        {/* Ret notu */}
                        {status === 'rejected' && report?.rejectionNotes && (
                          <div className="rounded-md border border-red-200 bg-red-50 p-4">
                            <h4 className="mb-1 text-sm font-medium text-red-800">Ret Notu</h4>
                            <p className="text-sm text-red-700">{report.rejectionNotes}</p>
                          </div>
                        )}

                        {/* Aksiyon butonları */}
                        <div className="flex flex-wrap gap-2">
                          {(status === 'not_started' || status === 'rejected') && (
                            <button
                              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                              disabled={runProcedurePrecheck.isPending}
                              onClick={() => runProcedurePrecheck.mutate({ forceRerun: status === 'rejected' })}
                            >
                              {runProcedurePrecheck.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                              Ön Kontrol Başlat
                            </button>
                          )}

                          {(status === 'precheck_done' || (status === 'rejected' && report?.precheckPassed)) && (
                            <button
                              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                              disabled={generateProcedureReport.isPending}
                              onClick={() => generateProcedureReport.mutate({ forceRerun: status === 'rejected' })}
                            >
                              {generateProcedureReport.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                              Usul Raporu Oluştur
                            </button>
                          )}

                          {status === 'draft' && (
                            <>
                              <button
                                className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                                disabled={reviewProcedureReport.isPending}
                                onClick={() => reviewProcedureReport.mutate({ approved: true })}
                              >
                                {reviewProcedureReport.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                                Onayla
                              </button>
                              <button
                                className="inline-flex items-center gap-2 rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                                disabled={reviewProcedureReport.isPending}
                                onClick={() => {
                                  const notes = prompt('Ret sebebi:')
                                  if (notes !== null) {
                                    reviewProcedureReport.mutate({ approved: false, rejectionNotes: notes })
                                  }
                                }}
                              >
                                Reddet
                              </button>
                              <button
                                className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                                disabled={generateProcedureReport.isPending}
                                onClick={() => generateProcedureReport.mutate({ forceRerun: true })}
                              >
                                {generateProcedureReport.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                                Yeniden Oluştur
                              </button>
                            </>
                          )}

                          {status === 'approved' && (
                            <div className="flex items-center gap-2 text-sm text-emerald-600">
                              <Scale className="h-4 w-4" />
                              Usul raporu onaylandı — araştırma aşamasına geçilebilir.
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'research' && id && (
            <ResearchTab caseId={id} caseData={caseData} />
          )}

          {/* ═══════ ESKİ ARAŞTIRMA KODU SİLİNDİ — ResearchTab bileşenine taşındı ═══════ */}

          {/* ═══════ DİLEKÇE SEKMESİ ═══════ */}
          {activeTab === 'pleading' && (
            <div className="space-y-4">
              {/* Durum kartı */}
              <Card>
                <CardContent className="space-y-4 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-law-primary">Dilekçe Taslağı (v1)</p>
                      <p className="text-xs text-muted-foreground">
                        Araştırma onaylandıktan sonra AI ile dilekçe taslağı üretilir.
                      </p>
                    </div>
                    {caseData?.case && (
                      <Badge
                        variant={
                          ['draft_ready'].includes(caseData.case.automationStatus)
                            ? 'warning'
                            : ['review_ready', 'completed'].includes(caseData.case.automationStatus)
                              ? 'success'
                              : 'secondary'
                        }
                      >
                        {automationStatusLabels[caseData.case.automationStatus] ||
                          caseData.case.automationStatus}
                      </Badge>
                    )}
                  </div>

                  {/* Üret butonu */}
                  {caseData?.case &&
                    ['draft_ready', 'review_ready', 'completed'].includes(
                      caseData.case.automationStatus
                    ) && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={generatePleading.isPending}
                          onClick={() => generatePleading.mutate({ forceRerun: false })}
                          className="inline-flex items-center gap-2 rounded-lg bg-law-accent px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50"
                        >
                          {generatePleading.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ScrollText className="h-4 w-4" />
                          )}
                          {pleadingData?.pleading?.artifact
                            ? 'Yeniden Üret'
                            : 'Dilekçe Taslağı Üret'}
                        </button>
                        {pleadingData?.pleading?.artifact && (
                          <>
                            <button
                              type="button"
                              disabled={generatePleading.isPending}
                              onClick={() => generatePleading.mutate({ forceRerun: true })}
                              className="inline-flex items-center gap-2 rounded-lg border border-law-accent px-4 py-2 text-sm font-medium text-law-accent hover:bg-law-accent/5 disabled:opacity-50"
                            >
                              Zorla Yeniden Üret
                            </button>
                            <button
                              type="button"
                              disabled={exportUdf.isPending}
                              onClick={() => exportUdf.mutate()}
                              className="inline-flex items-center gap-2 rounded-lg border border-emerald-500 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                            >
                              {exportUdf.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                              UDF İndir
                            </button>
                          </>
                        )}
                      </div>
                    )}

                  {/* Ön koşul uyarısı */}
                  {caseData?.case &&
                    !['draft_ready', 'review_ready', 'completed'].includes(
                      caseData.case.automationStatus
                    ) && (
                      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <span>
                          Dilekçe üretmek için araştırma kalite kontrolünün onaylanması gerekir.
                          Mevcut durum:{' '}
                          <strong>
                            {automationStatusLabels[caseData.case.automationStatus] ||
                              caseData.case.automationStatus}
                          </strong>
                        </span>
                      </div>
                    )}

                  {generatePleading.isError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      Hata: {generatePleading.error?.message}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Dilekçe içeriği */}
              {pleadingData?.pleading?.artifact && (() => {
                const artifact = pleadingData.pleading.artifact
                let fullContent = ''
                try {
                  const meta = artifact.metadata ? JSON.parse(artifact.metadata) : {}
                  fullContent = meta.fullContent || artifact.contentPreview || ''
                } catch {
                  fullContent = artifact.contentPreview || ''
                }

                return (
                  <Card>
                    <CardContent className="space-y-4 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-semibold text-law-primary">{artifact.title}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px]">
                            v{artifact.versionNo}
                          </Badge>
                          <button
                            type="button"
                            onClick={() => {
                              if (pleadingEditMode) {
                                setPleadingEditMode(false)
                              } else {
                                setPleadingEditContent(fullContent)
                                setPleadingEditMode(true)
                              }
                            }}
                            className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs hover:bg-muted/50"
                          >
                            <Edit className="h-3 w-3" />
                            {pleadingEditMode ? 'İptal' : 'Düzenle'}
                          </button>
                        </div>
                      </div>

                      {pleadingEditMode ? (
                        <div className="space-y-3">
                          <textarea
                            value={pleadingEditContent}
                            onChange={(e) => setPleadingEditContent(e.target.value)}
                            rows={25}
                            className="w-full rounded-lg border px-3 py-2 font-mono text-sm outline-none transition-colors focus:border-law-accent focus:ring-2 focus:ring-law-accent/20 resize-y"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setPleadingEditMode(false)}
                              className="rounded-lg border px-4 py-2 text-sm hover:bg-muted/50"
                            >
                              İptal
                            </button>
                            <button
                              type="button"
                              disabled={updatePleadingDraft.isPending}
                              onClick={() =>
                                updatePleadingDraft.mutate(
                                  { markdownContent: pleadingEditContent },
                                  { onSuccess: () => setPleadingEditMode(false) }
                                )
                              }
                              className="rounded-lg bg-law-accent px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50"
                            >
                              {updatePleadingDraft.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Kaydet'
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="max-h-[600px] overflow-auto rounded-lg border bg-card p-4">
                          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-800">
                            {fullContent}
                          </pre>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })()}

              {/* İnceleme paneli */}
              {pleadingData?.pleading?.job?.status === 'review_required' && (
                <Card className="border-amber-200 bg-amber-50/40">
                  <CardContent className="space-y-4 p-4">
                    <p className="text-sm font-semibold text-law-primary">Dilekçe İnceleme</p>
                    <p className="text-xs text-muted-foreground">
                      Taslağı inceleyin. Onaylanırsa savunma simülasyonu aşamasına geçilir.
                    </p>

                    <textarea
                      value={pleadingReviewNotes}
                      onChange={(e) => setPleadingReviewNotes(e.target.value)}
                      rows={3}
                      placeholder="İnceleme notu (opsiyonel)"
                      className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 resize-none"
                    />
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        disabled={reviewPleading.isPending}
                        onClick={() =>
                          reviewPleading.mutate(
                            { approved: false, reviewNotes: pleadingReviewNotes },
                            { onSuccess: () => setPleadingReviewNotes('') }
                          )
                        }
                        className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        Reddet
                      </button>
                      <button
                        type="button"
                        disabled={reviewPleading.isPending}
                        onClick={() =>
                          reviewPleading.mutate(
                            { approved: true, reviewNotes: pleadingReviewNotes },
                            { onSuccess: () => setPleadingReviewNotes('') }
                          )
                        }
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        Onayla — Savunma Simülasyonuna Geç
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* İnceleme geçmişi */}
              {pleadingData?.pleading?.reviews?.length > 0 && (
                <Card>
                  <CardContent className="space-y-2 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      İnceleme Geçmişi
                    </p>
                    {pleadingData!.pleading.reviews.map((review: any) => (
                      <div
                        key={review.id}
                        className="flex items-start gap-3 rounded-lg border bg-card p-3 text-xs"
                      >
                        <Badge
                          variant={review.status === 'approved' ? 'success' : 'danger'}
                          className="mt-0.5 text-[10px]"
                        >
                          {review.status === 'approved' ? 'Onay' : 'Red'}
                        </Badge>
                        <div>
                          {review.reviewNotes && (
                            <p className="text-muted-foreground">{review.reviewNotes}</p>
                          )}
                          <p className="mt-1 text-[10px] text-muted-foreground/60">
                            {review.reviewedAt ? formatDateTime(review.reviewedAt) : '-'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* ─── v2 Revizyon Bölümü ─── */}
              {caseData?.case &&
                ['review_ready', 'completed'].includes(caseData.case.automationStatus) &&
                pleadingData?.pleading?.artifact && (
                  <Card className="border-indigo-200 bg-indigo-50/30">
                    <CardContent className="space-y-4 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-law-primary">
                            Dilekçe v2 — Revizyon
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Savunma simülasyonu ışığında v1'i revize ederek v2 oluşturur.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={revisePleading.isPending}
                          onClick={() => revisePleading.mutate({ forceRerun: false })}
                          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {revisePleading.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ScrollText className="h-4 w-4" />
                          )}
                          v2 Dilekçe Üret
                        </button>
                      </div>

                      {revisePleading.isError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                          Hata: {revisePleading.error?.message}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

              {/* v2 içeriği — GET response'tan çekilecek (artifact listesi üzerinden) */}
              {pleadingData?.pleading?.reviews?.some(
                (r: any) => r.reviewType === 'pleading_v2_review'
              ) && (
                <Card>
                  <CardContent className="space-y-4 p-4">
                    <p className="text-sm font-semibold text-law-primary">v2 İnceleme</p>

                    {/* v2 review pending ise final onay formu */}
                    {pleadingData.pleading.reviews.some(
                      (r: any) =>
                        r.reviewType === 'pleading_v2_review' && r.status === 'pending'
                    ) && (
                      <div className="space-y-3 rounded-xl border bg-card p-4">
                        <textarea
                          value={finalReviewNotes}
                          onChange={(e) => setFinalReviewNotes(e.target.value)}
                          rows={3}
                          placeholder="Final inceleme notu (opsiyonel)"
                          className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none"
                        />
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            disabled={finalReviewPleading.isPending}
                            onClick={() =>
                              finalReviewPleading.mutate(
                                { approved: false, reviewNotes: finalReviewNotes },
                                { onSuccess: () => setFinalReviewNotes('') }
                              )
                            }
                            className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                          >
                            Reddet
                          </button>
                          <button
                            type="button"
                            disabled={finalReviewPleading.isPending}
                            onClick={() =>
                              finalReviewPleading.mutate(
                                { approved: true, reviewNotes: finalReviewNotes },
                                { onSuccess: () => setFinalReviewNotes('') }
                              )
                            }
                            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            Final Onay — Otomasyon Hattını Tamamla
                          </button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Step listesi */}
              {pleadingData?.pleading?.steps?.length > 0 && (
                <Card>
                  <CardContent className="space-y-2 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Dilekçe Hattı Adımları
                    </p>
                    <div className="space-y-1">
                      {pleadingData!.pleading.steps.map((step: any) => (
                        <div
                          key={step.id}
                          className="flex items-center gap-3 rounded border px-3 py-2 text-xs"
                        >
                          <Badge
                            variant={
                              step.status === 'completed'
                                ? 'success'
                                : step.status === 'in_progress'
                                  ? 'warning'
                                  : step.status === 'failed'
                                    ? 'danger'
                                    : 'secondary'
                            }
                            className="text-[10px]"
                          >
                            {step.status}
                          </Badge>
                          <span>{step.stepLabel}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ═══════ SAVUNMA SİMÜLASYONU SEKMESİ ═══════ */}
          {activeTab === 'defense' && (
            <div className="space-y-4">
              {/* Durum kartı */}
              <Card>
                <CardContent className="space-y-4 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-law-primary">Savunma Simülasyonu</p>
                      <p className="text-xs text-muted-foreground">
                        Karşı taraf perspektifinden en güçlü savunmaları analiz eder,
                        her biri için yanıt stratejisi ve dilekçeye eklenmesi gereken paragrafları önerir.
                      </p>
                    </div>
                    {defenseData?.defenseSimulation?.job && (
                      <Badge
                        variant={
                          defenseData.defenseSimulation.job.status === 'completed'
                            ? 'success'
                            : defenseData.defenseSimulation.job.status === 'review_required'
                              ? 'warning'
                              : defenseData.defenseSimulation.job.status === 'in_progress'
                                ? 'default'
                                : 'secondary'
                        }
                      >
                        {defenseData.defenseSimulation.job.status === 'completed'
                          ? 'Tamamlandı'
                          : defenseData.defenseSimulation.job.status === 'review_required'
                            ? 'İnceleme Bekliyor'
                            : defenseData.defenseSimulation.job.status === 'in_progress'
                              ? 'Üretiliyor...'
                              : 'Beklemede'}
                      </Badge>
                    )}
                  </div>

                  {/* Üret butonu */}
                  {caseData?.case &&
                    ['review_ready', 'completed'].includes(caseData.case.automationStatus) && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={generateDefense.isPending}
                          onClick={() => generateDefense.mutate({ forceRerun: false })}
                          className="inline-flex items-center gap-2 rounded-lg bg-law-primary px-4 py-2 text-sm font-medium text-white hover:bg-[#162d4a] disabled:opacity-50"
                        >
                          {generateDefense.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Shield className="h-4 w-4" />
                          )}
                          {defenseData?.defenseSimulation?.artifact
                            ? 'Yeniden Simüle Et'
                            : 'Savunma Simülasyonu Başlat'}
                        </button>
                        {defenseData?.defenseSimulation?.artifact && (
                          <button
                            type="button"
                            disabled={generateDefense.isPending}
                            onClick={() => generateDefense.mutate({ forceRerun: true })}
                            className="inline-flex items-center gap-2 rounded-lg border border-law-primary px-4 py-2 text-sm font-medium text-law-primary hover:bg-law-primary/5 disabled:opacity-50"
                          >
                            Zorla Yeniden Üret
                          </button>
                        )}
                      </div>
                    )}

                  {/* Ön koşul uyarısı */}
                  {caseData?.case &&
                    !['review_ready', 'completed'].includes(caseData.case.automationStatus) && (
                      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <span>
                          Savunma simülasyonu için dilekçe v1 onaylanmış olmalı. Mevcut durum:{' '}
                          <strong>
                            {automationStatusLabels[caseData.case.automationStatus] ||
                              caseData.case.automationStatus}
                          </strong>
                        </span>
                      </div>
                    )}

                  {generateDefense.isError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      Hata: {generateDefense.error?.message}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Simülasyon içeriği */}
              {defenseData?.defenseSimulation?.artifact && (() => {
                const artifact = defenseData.defenseSimulation.artifact
                let fullContent = ''
                try {
                  const meta = artifact.metadata ? JSON.parse(artifact.metadata) : {}
                  fullContent = meta.fullContent || artifact.contentPreview || ''
                } catch {
                  fullContent = artifact.contentPreview || ''
                }
                const hasRiskFlag = (() => {
                  try {
                    return artifact.metadata ? JSON.parse(artifact.metadata).hasRiskFlag : false
                  } catch { return false }
                })()

                return (
                  <Card className={hasRiskFlag ? 'border-red-200' : ''}>
                    <CardContent className="space-y-4 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-semibold text-law-primary">{artifact.title}</p>
                        <div className="flex items-center gap-2">
                          {hasRiskFlag && (
                            <Badge variant="danger" className="text-[10px]">
                              Risk Flag
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-[10px]">
                            v{artifact.versionNo}
                          </Badge>
                        </div>
                      </div>

                      {hasRiskFlag && (
                        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                          <span>
                            Bu simülasyonda doğrulanması gereken referanslar veya bulunamayan
                            kararlar tespit edildi. Dikkatli inceleme önerilir.
                          </span>
                        </div>
                      )}

                      <div className="max-h-[600px] overflow-auto rounded-lg border bg-card p-4">
                        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-800">
                          {fullContent}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                )
              })()}

              {/* İnceleme paneli */}
              {defenseData?.defenseSimulation?.job?.status === 'review_required' && (
                <Card className="border-amber-200 bg-amber-50/40">
                  <CardContent className="space-y-4 p-4">
                    <p className="text-sm font-semibold text-law-primary">Simülasyon İnceleme</p>
                    <p className="text-xs text-muted-foreground">
                      Savunma simülasyonunu inceleyin. Onaylanırsa dilekçe v2 (revizyon) aşamasına geçilebilir.
                    </p>

                    <textarea
                      value={defenseReviewNotes}
                      onChange={(e) => setDefenseReviewNotes(e.target.value)}
                      rows={3}
                      placeholder="İnceleme notu (opsiyonel) — ek savunma noktaları veya eksikler."
                      className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 resize-none"
                    />
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        disabled={reviewDefense.isPending}
                        onClick={() =>
                          reviewDefense.mutate(
                            { approved: false, reviewNotes: defenseReviewNotes },
                            { onSuccess: () => setDefenseReviewNotes('') }
                          )
                        }
                        className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        Reddet
                      </button>
                      <button
                        type="button"
                        disabled={reviewDefense.isPending}
                        onClick={() =>
                          reviewDefense.mutate(
                            { approved: true, reviewNotes: defenseReviewNotes },
                            { onSuccess: () => setDefenseReviewNotes('') }
                          )
                        }
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        Onayla — Dilekçe v2'ye Geç
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* İnceleme geçmişi */}
              {defenseData?.defenseSimulation?.reviews?.length > 0 && (
                <Card>
                  <CardContent className="space-y-2 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      İnceleme Geçmişi
                    </p>
                    {defenseData!.defenseSimulation.reviews.map((review: any) => (
                      <div
                        key={review.id}
                        className="flex items-start gap-3 rounded-lg border bg-card p-3 text-xs"
                      >
                        <Badge
                          variant={review.status === 'approved' ? 'success' : 'danger'}
                          className="mt-0.5 text-[10px]"
                        >
                          {review.status === 'approved' ? 'Onay' : 'Red'}
                        </Badge>
                        <div>
                          {review.reviewNotes && (
                            <p className="text-muted-foreground">{review.reviewNotes}</p>
                          )}
                          <p className="mt-1 text-[10px] text-muted-foreground/60">
                            {review.reviewedAt ? formatDateTime(review.reviewedAt) : '-'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Step listesi */}
              {defenseData?.defenseSimulation?.steps?.length > 0 && (
                <Card>
                  <CardContent className="space-y-2 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Simülasyon Adımları
                    </p>
                    <div className="space-y-1">
                      {defenseData!.defenseSimulation.steps.map((step: any) => (
                        <div
                          key={step.id}
                          className="flex items-center gap-3 rounded border px-3 py-2 text-xs"
                        >
                          <Badge
                            variant={
                              step.status === 'completed'
                                ? 'success'
                                : step.status === 'in_progress'
                                  ? 'warning'
                                  : step.status === 'failed'
                                    ? 'danger'
                                    : 'secondary'
                            }
                            className="text-[10px]"
                          >
                            {step.status}
                          </Badge>
                          <span>{step.stepLabel}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowDocumentForm(!showDocumentForm)}
                  className="inline-flex items-center gap-2 rounded-lg bg-law-accent px-3 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]"
                >
                  {showDocumentForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {showDocumentForm ? 'İptal' : 'Belge Yükle'}
                </button>
              </div>

              {showDocumentForm && (
                <Card className="border-law-accent/30 bg-law-accent/5">
                  <CardContent className="p-4">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        if (!id || documentFiles.length === 0) return

                        createDocument.mutate(
                          {
                            caseId: id,
                            files: documentFiles,
                            description: documentDescription,
                          },
                          {
                            onSuccess: () => {
                              setShowDocumentForm(false)
                              setDocumentFiles([])
                              setDocumentDescription('')
                            },
                          }
                        )
                      }}
                      className="space-y-3"
                    >
                      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-medium">Dosyalar *</label>
                          <div className="mb-3 rounded-xl border border-dashed border-law-accent/40 bg-card/80 p-4">
                            <p className="text-sm font-medium text-law-primary">
                              PDF, UDF, ZIP, TIFF ve fotograf dosyalarini secin
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {DOCUMENT_UPLOAD_HELP_TEXT} Tek seferde en fazla {MAX_DOCUMENT_UPLOAD_FILES} belge, belge basina en fazla {MAX_DOCUMENT_UPLOAD_SIZE_MB} MB.
                            </p>
                            <input
                              type="file"
                              multiple
                              accept={DOCUMENT_ACCEPT_ATTRIBUTE}
                              onChange={(e) => appendSelectedFiles(e.target.files)}
                              className="mt-3 block w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-law-accent/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-law-accent"
                            />
                            <p className="mt-2 text-xs text-muted-foreground">
                              Dosya sectikten sonra asagida listelenmesi gerekir.
                            </p>
                          </div>
                          <label className="hidden cursor-pointer flex-col gap-3 rounded-xl border border-dashed border-law-accent/40 bg-card/80 p-4 transition-colors hover:border-law-accent hover:bg-card">
                            <div>
                              <p className="text-sm font-medium text-law-primary">
                                PDF, UDF, ZIP, TIFF ve fotoğraf dosyalarını seçin
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {DOCUMENT_UPLOAD_HELP_TEXT} Tek seferde en fazla {MAX_DOCUMENT_UPLOAD_FILES} belge, belge başına en fazla {MAX_DOCUMENT_UPLOAD_SIZE_MB} MB.
                              </p>
                            </div>
                            <input
                              type="file"
                              multiple
                              accept={DOCUMENT_ACCEPT_ATTRIBUTE}
                              onChange={(e) => {
                                appendSelectedFiles(e.target.files)
                                e.currentTarget.value = ''
                              }}
                              className="hidden"
                            />
                            <div className="inline-flex w-fit items-center gap-2 rounded-lg bg-law-accent px-3 py-2 text-sm font-medium text-white">
                              <Plus className="h-4 w-4" />
                              Dosya Sec
                            </div>
                          </label>
                          <p className="mt-2 text-xs text-muted-foreground">
                            AI workspace varsa dosyalar dava klasörü altındaki `04-Müvekkil-Belgeleri\\00-Ham` klasörüne yazılır.
                          </p>
                          {documentFiles.length > 0 && (
                            <div className="mt-3 space-y-2 rounded-lg border bg-card/90 p-3">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                  Secilen Belgeler
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {documentFiles.length} dosya · {formatFileSize(selectedDocumentTotalSize)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                {documentFiles.map((file) => (
                                  <div
                                    key={`${file.name}-${file.lastModified}-${file.size}`}
                                    className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                                  >
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-medium">{file.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {getDocumentTypeLabel(file.name)} · {formatFileSize(file.size)}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeSelectedDocument(file)}
                                      className="rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium">Toplu Aciklama</label>
                          <textarea
                            value={documentDescription}
                            onChange={(e) => setDocumentDescription(e.target.value)}
                            rows={4}
                            placeholder="Ortak not, kaynak veya bu belge grubunun neyi ispatladigi..."
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-law-accent focus:ring-2 focus:ring-law-accent/20 resize-none"
                          />
                          <div className="mt-3 rounded-lg border bg-card/80 p-3 text-xs text-muted-foreground">
                            UYAP indirmelerinde genelde gelen `pdf`, `udf`, `zip`, `tif` ve `tiff` uzantilari dogrudan desteklenir. Fotoğraflar icin `jpg`, `jpeg`, `png`, `webp`, `heic` ve `heif` yuklenebilir.
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={createDocument.isPending || documentFiles.length === 0}
                          className="inline-flex items-center gap-2 rounded-lg bg-law-accent px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50"
                        >
                          {createDocument.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                          {documentFiles.length > 1 ? `${documentFiles.length} Belgeyi Kaydet ve Yükle` : 'Belgeyi Kaydet ve Yükle'}
                        </button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              <Card className="border-law-accent/20 bg-law-accent/5">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Belge Sayisi
                      </p>
                      <p className="mt-1 text-2xl font-bold text-law-primary">
                        {documents.length}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        PDF, UDF, ZIP, TIFF ve yaygin ofis/fotograf dosyalari desteklenir.
                      </p>
                    </div>
                    <div className="lg:col-span-2">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        AI Evrak Listesi
                      </p>
                      <div className="flex items-start gap-2 rounded-lg border bg-card/80 p-3">
                        <FileText className="mt-0.5 h-4 w-4 text-law-accent" />
                        <code className="break-all text-xs">
                          {caseData.driveFolderPath
                            ? `${caseData.driveFolderPath}\\04-Müvekkil-Belgeleri\\evrak-listesi.md`
                            : 'Henüz oluşmadı'}
                        </code>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-0">
                  {documents.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-center">
                      <FileText className="mb-2 h-8 w-8 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">Belge kaydi bulunmuyor</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Bu dava icin kayitli belge olustugunda burada listelenecek. UYAP'tan indirilen PDF, UDF, ZIP ve TIFF dosyalari da yuklenebilir.
                      </p>
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          <th className="px-4 py-3">Belge</th>
                          <th className="hidden px-4 py-3 md:table-cell">Tip / Boyut</th>
                          <th className="hidden px-4 py-3 sm:table-cell">Tarih</th>
                          <th className="px-4 py-3">Aciklama</th>
                          <th className="px-4 py-3"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {documents.map((doc: any) => (
                          <tr key={doc.id} className="hover:bg-muted/50">
                            <td className="px-4 py-3">
                              <div className="flex items-start gap-3">
                                <div className="rounded-lg bg-muted p-2">
                                  <FileText className="h-4 w-4 text-slate-700" />
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate font-medium">{doc.fileName}</p>
                                  <div className="mt-1 flex flex-wrap items-center gap-2">
                                    <Badge variant="secondary">{getDocumentTypeLabel(doc.fileName)}</Badge>
                                    <p className="truncate text-xs text-muted-foreground">
                                      {doc.fileUrl || '-'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="hidden px-4 py-3 md:table-cell">
                              <p className="text-muted-foreground">{doc.mimeType || '-'}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(doc.fileSize)}
                              </p>
                            </td>
                            <td className="hidden px-4 py-3 sm:table-cell text-xs text-muted-foreground">
                              {formatDateTime(doc.createdAt)}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {doc.description || '-'}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-2">
                                <a
                                  href={`/api/documents/${doc.id}/download`}
                                  className="rounded px-2 py-1 text-xs font-medium text-law-accent hover:bg-law-accent/10"
                                >
                                  Indir
                                </a>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm('Bu belgeyi silmek istediginize emin misiniz?')) {
                                      deleteDocument.mutate(doc.id)
                                    }
                                  }}
                                  className="rounded p-1 text-muted-foreground/40 hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Notlar */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              {/* Not ekleme formu */}
              <Card className="border-law-accent/30 bg-law-accent/5">
                <CardContent className="p-4">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (!noteContent.trim()) return
                      createNote.mutate(
                        { content: noteContent, caseId: id },
                        { onSuccess: () => setNoteContent('') },
                      )
                    }}
                    className="flex gap-3"
                  >
                    <textarea
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      rows={2}
                      className="flex-1 rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-law-accent focus:ring-2 focus:ring-law-accent/20 resize-none"
                      placeholder="Not ekleyin..."
                    />
                    <button
                      type="submit"
                      disabled={createNote.isPending || !noteContent.trim()}
                      className="flex-shrink-0 self-end rounded-lg bg-law-accent p-2.5 text-white transition-colors hover:bg-[#1d4ed8] disabled:opacity-50"
                    >
                      {createNote.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </form>
                </CardContent>
              </Card>

              {/* Not listesi */}
              <Card>
                <CardContent className={notes.length === 0 ? 'p-0' : 'space-y-3 p-4'}>
                  {notes.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-center">
                      <StickyNote className="mb-2 h-8 w-8 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">Henüz not eklenmemiş</p>
                    </div>
                  ) : (
                    notes.map((n: any) => (
                      <div key={n.id} className="group rounded-lg border p-3">
                        <p className="whitespace-pre-wrap text-sm">{n.content}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(n.createdAt)}
                            {n.createdByName && ` · ${n.createdByName}`}
                          </p>
                          <button
                            onClick={() => {
                              if (confirm('Bu notu silmek istediğinize emin misiniz?')) {
                                deleteNote.mutate(n.id)
                              }
                            }}
                            className="rounded p-1 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/40 hover:!bg-red-50 hover:!text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
