/**
 * ResearchTab — Dava araştırma iş akışı ana bileşeni
 *
 * 3 aşamalı akış:
 * 1. Girdi Toplama (belgeler + avukat notu + müvekkil notu)
 * 2. Kritik Nokta (AI tespit + avukat onayı)
 * 3. Araştırma (4 kaynak: Yargı Kararları, Mevzuat, NotebookLM, Vektör DB)
 */

import { useEffect, useState } from 'react'
import {
  useApproveCaseIntakeProfile,
  useCaseIntakeProfile,
  useGenerateCriticalPoint,
  useUpdateCaseIntakeProfile,
} from '@/hooks/useIntake'
import {
  useCaseResearchProfile,
  useCaseResearchQc,
  useReviewCaseResearch,
  useRunCaseResearch,
  useUpdateCaseResearchProfile,
  useUpdateResearchArguments,
  type ParallelResearchResult,
  type ResearchSourceRunResult,
} from '@/hooks/useResearch'
import { useCaseDocuments, useCaseNotes } from '@/hooks/useCases'
import { formatDateTime } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  FileText,
  MessageSquare,
  UserCheck,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Scale,
  BookOpen,
  Brain,
  Database,
  Sparkles,
  AlertCircle,
  Save,
  Play,
  Eye,
  XCircle,
  RefreshCw,
  TriangleAlert,
} from 'lucide-react'

type ResearchTabProps = {
  caseId: string
  caseData: any
}

// ─── Stepper ────────────────────────────────────────────────

type StepState = 'completed' | 'active' | 'pending'

function StepIndicator({ step, label, state }: { step: number; label: string; state: StepState }) {
  return (
    <div className="flex items-center gap-2">
      {state === 'completed' ? (
        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
      ) : state === 'active' ? (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-law-accent text-[11px] font-bold text-white">
          {step}
        </div>
      ) : (
        <Circle className="h-5 w-5 text-muted-foreground/30" />
      )}
      <span
        className={`text-sm font-medium ${
          state === 'completed'
            ? 'text-emerald-700'
            : state === 'active'
              ? 'text-law-primary'
              : 'text-muted-foreground/50'
        }`}
      >
        {label}
      </span>
    </div>
  )
}

function StepConnector({ active }: { active: boolean }) {
  return (
    <div
      className={`mx-2.5 hidden h-px w-8 sm:block ${active ? 'bg-emerald-400' : 'bg-border'}`}
    />
  )
}

// ─── Source Card ─────────────────────────────────────────────

function SourceCard({
  title,
  description,
  icon: Icon,
  enabled,
  onToggle,
  color,
  children,
  expandable = false,
}: {
  title: string
  description: string
  icon: React.ElementType
  enabled: boolean
  onToggle: (v: boolean) => void
  color: string
  children?: React.ReactNode
  expandable?: boolean
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className={`rounded-xl border-2 transition-all ${
        enabled ? `${color} shadow-sm` : 'border-border bg-muted/20 opacity-60'
      }`}
    >
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <div
            className={`rounded-lg p-2 ${
              enabled ? 'bg-white/80 shadow-sm' : 'bg-muted/40'
            }`}
          >
            <Icon className={`h-5 w-5 ${enabled ? 'text-law-primary' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <p className={`text-sm font-semibold ${enabled ? 'text-law-primary' : 'text-muted-foreground'}`}>
              {title}
            </p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {expandable && enabled && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted/50 cursor-pointer"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => onToggle(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-muted-foreground/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-law-accent" />
          </label>
        </div>
      </div>
      {enabled && expanded && children && (
        <div className="border-t px-4 pb-4 pt-3">{children}</div>
      )}
    </div>
  )
}

// ─── Source Result Card ─────────────────────────────────────

const SOURCE_ICONS: Record<string, React.ElementType> = {
  yargi_mcp: Scale,
  mevzuat_mcp: BookOpen,
  notebooklm: Brain,
  vector_db: Database,
}

const SOURCE_LABELS: Record<string, string> = {
  yargi_mcp: 'Yargi Kararlari',
  mevzuat_mcp: 'Ilgili Mevzuat',
  notebooklm: 'NotebookLM',
  vector_db: 'Vektor Veritabani',
}

const SOURCE_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  yargi_mcp: { border: 'border-blue-200', bg: 'bg-blue-50', text: 'text-blue-700' },
  mevzuat_mcp: { border: 'border-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  notebooklm: { border: 'border-purple-200', bg: 'bg-purple-50', text: 'text-purple-700' },
  vector_db: { border: 'border-orange-200', bg: 'bg-orange-50', text: 'text-orange-700' },
}

function SourceResultCard({
  source,
  onRetry,
  retrying,
}: {
  source: ResearchSourceRunResult
  onRetry?: () => void
  retrying?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const Icon = SOURCE_ICONS[source.sourceType] || Brain
  const colors = SOURCE_COLORS[source.sourceType] || SOURCE_COLORS.yargi_mcp

  return (
    <div className={`rounded-xl border-2 ${colors.border} overflow-hidden`}>
      {/* Header */}
      <div className={`flex items-center justify-between gap-2 p-3 ${source.status === 'failed' ? 'bg-red-50' : colors.bg}`}>
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${source.status === 'failed' ? 'text-red-600' : colors.text}`} />
          <p className={`text-sm font-semibold ${source.status === 'failed' ? 'text-red-800' : colors.text}`}>
            {SOURCE_LABELS[source.sourceType] || source.sourceName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {source.status === 'failed' && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              disabled={retrying}
              className="inline-flex items-center gap-1 rounded-md border border-red-300 bg-white px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 cursor-pointer"
            >
              {retrying ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              Tekrar Dene
            </button>
          )}
          <Badge
            variant={
              source.status === 'completed' ? 'success'
                : source.status === 'failed' ? 'danger'
                  : 'secondary'
            }
          >
            {source.status === 'completed' ? 'Basarili'
              : source.status === 'failed' ? 'Hata'
                : source.status === 'skipped' ? 'Atlanid' : source.status}
          </Badge>
        </div>
      </div>

      {/* Body */}
      <div className="p-3">
        <p className="text-sm">{source.summary}</p>

        {/* Error message — always visible when failed */}
        {source.status === 'failed' && source.errorMessage && (
          <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-2">
            <div className="flex items-start gap-2">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <pre className="whitespace-pre-wrap text-xs text-red-700 font-mono leading-relaxed">
                {source.errorMessage.slice(0, 500)}
              </pre>
            </div>
          </div>
        )}

        {/* Expand/collapse content */}
        {source.status === 'completed' && source.markdownContent && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center gap-1 text-xs font-medium text-law-accent hover:underline cursor-pointer"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? 'Icerigi gizle' : 'Tam icerigi goruntule'}
            </button>
            {expanded && (
              <div className="mt-2 max-h-[400px] overflow-y-auto rounded-lg border bg-white p-3">
                <pre className="whitespace-pre-wrap text-xs leading-relaxed font-sans">
                  {source.markdownContent}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────

export default function ResearchTab({ caseId, caseData }: ResearchTabProps) {
  // ─── Data hooks ─────────────────────────
  const { data: intakeProfileData } = useCaseIntakeProfile(caseId)
  const { data: researchProfileData } = useCaseResearchProfile(caseId)
  const { data: documentsData } = useCaseDocuments(caseId)
  const { data: notesData } = useCaseNotes(caseId)
  const { data: researchQcData } = useCaseResearchQc(caseId)

  // ─── Mutations ──────────────────────────
  const updateIntake = useUpdateCaseIntakeProfile(caseId)
  const generateCritical = useGenerateCriticalPoint(caseId)
  const approveIntake = useApproveCaseIntakeProfile(caseId)
  const updateResearch = useUpdateCaseResearchProfile(caseId)
  const runResearch = useRunCaseResearch(caseId)
  const reviewResearch = useReviewCaseResearch(caseId)
  const updateArguments = useUpdateResearchArguments(caseId)

  // ─── Derived data ──────────────────────
  const intakeProfile = intakeProfileData?.profile || null
  const researchProfile = researchProfileData?.profile || null
  const documents = documentsData?.documents || documentsData || []
  const notes = notesData?.notes || notesData || []

  // ─── Step 2: Critical Point state ──────
  const [lawyerDirection, setLawyerDirection] = useState('')
  const [clientNotes, setClientNotes] = useState('')
  const [criticalPoint, setCriticalPoint] = useState('')
  const [mainLegalAxis, setMainLegalAxis] = useState('')
  const [secondaryRisks, setSecondaryRisks] = useState('')
  const [proofRisks, setProofRisks] = useState('')
  const [opponentArgs, setOpponentArgs] = useState('')
  const [missingInfo, setMissingInfo] = useState('')
  const [missingDocs, setMissingDocs] = useState('')
  const [showDetails, setShowDetails] = useState(false)

  // ─── Step 3: Research state ─────────────
  const [useYargi, setUseYargi] = useState(true)
  const [useMevzuat, setUseMevzuat] = useState(true)
  const [useNotebook, setUseNotebook] = useState(false)
  const [useVector, setUseVector] = useState(false)
  const [notebookId, setNotebookId] = useState('')
  const [researchQuestion, setResearchQuestion] = useState('')
  const [searchKeywords, setSearchKeywords] = useState('')
  // Advanced (hidden by default)
  const [yargiQuery, setYargiQuery] = useState('')
  const [yargiChamber, setYargiChamber] = useState('')
  const [yargiDateStart, setYargiDateStart] = useState('')
  const [yargiDateEnd, setYargiDateEnd] = useState('')
  const [mevzuatQuery, setMevzuatQuery] = useState('')
  const [mevzuatLawNumbers, setMevzuatLawNumbers] = useState('')
  const [vectorCollections, setVectorCollections] = useState('')
  const [vectorQuery, setVectorQuery] = useState('')

  // ─── Research results state ─────────────
  const [parallelResult, setParallelResult] = useState<ParallelResearchResult | null>(null)
  const [researchError, setResearchError] = useState<string | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')

  // ─── Sync from server ──────────────────
  useEffect(() => {
    if (!intakeProfile) return
    setLawyerDirection(intakeProfile.lawyerDirection || '')
    setClientNotes(intakeProfile.clientInterviewNotes || '')
    setCriticalPoint(intakeProfile.criticalPointSummary || '')
    setMainLegalAxis(intakeProfile.mainLegalAxis || '')
    setSecondaryRisks(intakeProfile.secondaryRisks || '')
    setProofRisks(intakeProfile.proofRisks || '')
    setOpponentArgs(intakeProfile.opponentInitialArguments || '')
    setMissingInfo(intakeProfile.missingInformation || '')
    setMissingDocs(intakeProfile.missingDocuments || '')
  }, [intakeProfile])

  useEffect(() => {
    if (!researchProfile) return
    const q =
      researchProfile.researchQuestion ||
      intakeProfile?.criticalPointSummary ||
      caseData?.description ||
      ''
    setResearchQuestion(q)
    setSearchKeywords(researchProfile.searchKeywords || '')
    setUseYargi(researchProfile.useYargiMcp ?? true)
    setUseMevzuat(researchProfile.useMevzuatMcp ?? true)
    setUseNotebook(!!researchProfile.useNotebooklm)
    setNotebookId(researchProfile.notebooklmNotebook || '')
    setUseVector(!!researchProfile.useVectorDb)
    setYargiQuery(researchProfile.yargiQuery || '')
    setYargiChamber(researchProfile.yargiChamber || '')
    setYargiDateStart(researchProfile.yargiDateStart || '')
    setYargiDateEnd(researchProfile.yargiDateEnd || '')
    setMevzuatQuery(researchProfile.mevzuatQuery || '')
    setMevzuatLawNumbers(researchProfile.mevzuatLawNumbers || '')
    setVectorCollections(researchProfile.vectorCollections || '')
    setVectorQuery(researchProfile.vectorQuery || '')
  }, [researchProfile])

  // ─── Stepper state ─────────────────────
  const hasInput = documents.length > 0 || lawyerDirection.trim() || clientNotes.trim()
  const criticalApproved = !!intakeProfile?.approvedByLawyer
  const researchDone = researchProfile?.lastRunStatus === 'completed'

  const step1State: StepState = hasInput ? 'completed' : 'active'
  const step2State: StepState = criticalApproved ? 'completed' : hasInput ? 'active' : 'pending'
  const step3State: StepState = researchDone
    ? 'completed'
    : criticalApproved
      ? 'active'
      : 'pending'

  // ─── Build profile payload ─────────────
  function buildProfilePayload() {
    return {
      researchQuestion,
      searchKeywords,
      useYargiMcp: useYargi,
      yargiQuery,
      yargiCourtTypes: 'YARGITAYKARARI,ISTINAFHUKUK',
      yargiChamber,
      yargiDateStart,
      yargiDateEnd,
      yargiResultLimit: 5,
      useMevzuatMcp: useMevzuat,
      mevzuatQuery,
      mevzuatScope: '',
      mevzuatLawNumbers,
      mevzuatResultLimit: 5,
      useNotebooklm: useNotebook,
      notebooklmNotebook: notebookId,
      notebooklmQuestion: '',
      useVectorDb: useVector,
      vectorCollections,
      vectorQuery,
      vectorTopK: 5,
    }
  }

  // ─── Handlers ──────────────────────────

  const handleSaveProfile = () => {
    updateIntake.mutate({
      lawyerDirection,
      clientInterviewNotes: clientNotes,
      criticalPointSummary: criticalPoint,
      mainLegalAxis,
      secondaryRisks,
      proofRisks,
      missingInformation: missingInfo,
      missingDocuments: missingDocs,
      opponentInitialArguments: opponentArgs,
    })
  }

  const handleGenerateCritical = () => {
    generateCritical.mutate({ lawyerDirection, clientInterviewNotes: clientNotes })
  }

  const handleApproveCritical = () => {
    approveIntake.mutate({
      approved: true,
      lawyerDirection,
      clientInterviewNotes: clientNotes,
      criticalPointSummary: criticalPoint,
      mainLegalAxis,
      secondaryRisks,
      proofRisks,
      missingInformation: missingInfo,
      missingDocuments: missingDocs,
      opponentInitialArguments: opponentArgs,
    })
  }

  const handleSaveResearchProfile = () => {
    updateResearch.mutate(buildProfilePayload())
  }

  /** Paralel araştırma — 4 kaynağı aynı anda çalıştır */
  const handleRunParallel = () => {
    setResearchError(null)
    setParallelResult(null)

    // Profili kaydet, sonra araştırmayı başlat
    updateResearch.mutate(buildProfilePayload(), {
      onSuccess: () => {
        runResearch.mutate(
          { forceNewRun: true },
          {
            onSuccess: (data) => {
              setParallelResult(data)
            },
            onError: (err: any) => {
              setResearchError(err?.response?.data?.error || err?.message || 'Paralel arastirma basarisiz.')
            },
          },
        )
      },
    })
  }

  const isResearching = runResearch.isPending || updateResearch.isPending

  // ─── Derived: active source runs for display ──────
  const sourceRuns = parallelResult?.sourceRuns || []
  const failedSources = sourceRuns.filter((s) => s.status === 'failed')
  const completedSources = sourceRuns.filter((s) => s.status === 'completed')
  return (
    <div className="space-y-5">
      {/* ─── Stepper ──────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1 rounded-xl border bg-card px-4 py-3">
        <StepIndicator step={1} label="Girdi" state={step1State} />
        <StepConnector active={step1State === 'completed'} />
        <StepIndicator step={2} label="Kritik Nokta" state={step2State} />
        <StepConnector active={step2State === 'completed'} />
        <StepIndicator step={3} label="Arastirma" state={step3State} />
      </div>

      {/* ─── STEP 1: Girdi Ozeti ─────────────────── */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-law-primary">
            <FileText className="h-4 w-4" />
            Dava Girdileri
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border bg-muted/30 py-3">
              <p className="text-2xl font-bold text-law-primary">{documents.length}</p>
              <p className="text-xs text-muted-foreground">Belge</p>
            </div>
            <div className="rounded-lg border bg-muted/30 py-3">
              <p className="text-2xl font-bold text-law-primary">{notes.length}</p>
              <p className="text-xs text-muted-foreground">Not</p>
            </div>
            <div className="rounded-lg border bg-muted/30 py-3">
              <p className="text-2xl font-bold text-law-primary">
                {caseData?.caseType ? 1 : 0}
              </p>
              <p className="text-xs text-muted-foreground">Dava Turu</p>
            </div>
          </div>
          {!hasInput && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Belge yukleyin, not ekleyin veya asagida avukat yonlendirmesi girin.
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── STEP 2: Kritik Nokta ────────────────── */}
      <Card className="border-law-accent/20 bg-law-accent/5">
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-law-accent" />
              <p className="text-sm font-semibold text-law-primary">Kritik Nokta Tespiti</p>
            </div>
            <Badge variant={criticalApproved ? 'success' : 'secondary'}>
              {criticalApproved ? 'Onaylandi' : 'Taslak'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium">
                <MessageSquare className="mr-1 inline h-3 w-3" />
                Avukat Yonlendirmesi
              </label>
              <textarea
                value={lawyerDirection}
                onChange={(e) => setLawyerDirection(e.target.value)}
                rows={5}
                placeholder="Bu davadaki ana stratejinizi ve odak noktanizi yazin..."
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none resize-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium">
                <UserCheck className="mr-1 inline h-3 w-3" />
                Muvekkil Gorusme Notlari
              </label>
              <textarea
                value={clientNotes}
                onChange={(e) => setClientNotes(e.target.value)}
                rows={5}
                placeholder="Muvekkilden alinan bilgiler..."
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none resize-none"
              />
            </div>
          </div>

          {/* Critical Point */}
          <div>
            <label className="mb-1.5 block text-xs font-medium">
              <AlertCircle className="mr-1 inline h-3 w-3" />
              Kritik Nokta Ozeti
            </label>
            <textarea
              value={criticalPoint}
              onChange={(e) => setCriticalPoint(e.target.value)}
              rows={3}
              placeholder="Davayi kazanmak veya kaybetmek icin en kritik hukuki mesele..."
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none resize-none"
            />
          </div>

          {/* Toggle details */}
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="inline-flex items-center gap-1 text-xs font-medium text-law-accent hover:underline cursor-pointer"
          >
            {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {showDetails ? 'Detaylari gizle' : 'Detaylari goster (hukuki eksen, riskler, ispat...)'}
          </button>

          {showDetails && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium">Ana Hukuki Eksen</label>
                <input
                  value={mainLegalAxis}
                  onChange={(e) => setMainLegalAxis(e.target.value)}
                  placeholder="ornek: hakli fesih, tahliye, nafaka"
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Ikincil Riskler</label>
                <input
                  value={secondaryRisks}
                  onChange={(e) => setSecondaryRisks(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Ispat Riskleri</label>
                <input
                  value={proofRisks}
                  onChange={(e) => setProofRisks(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Karsi Taraf Argumanlari</label>
                <input
                  value={opponentArgs}
                  onChange={(e) => setOpponentArgs(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Eksik Bilgi</label>
                <input
                  value={missingInfo}
                  onChange={(e) => setMissingInfo(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Eksik Belgeler</label>
                <input
                  value={missingDocs}
                  onChange={(e) => setMissingDocs(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                />
              </div>
            </div>
          )}

          {/* Auto summaries */}
          {(intakeProfile?.autoDocumentSummary || intakeProfile?.autoFactSummary) && (
            <div className="rounded-lg border bg-card/80 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Otomatik Ozet</p>
              {intakeProfile?.autoDocumentSummary && (
                <div className="mt-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide">Belge Ozeti</p>
                  <p className="mt-1 whitespace-pre-wrap">{intakeProfile.autoDocumentSummary}</p>
                </div>
              )}
              {intakeProfile?.autoFactSummary && (
                <div className="mt-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide">Olgu Ozeti</p>
                  <p className="mt-1 whitespace-pre-wrap">{intakeProfile.autoFactSummary}</p>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              disabled={updateIntake.isPending}
              onClick={handleSaveProfile}
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50 cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              Kaydet
            </button>
            <button
              type="button"
              disabled={generateCritical.isPending || (!lawyerDirection.trim() && !clientNotes.trim())}
              onClick={handleGenerateCritical}
              className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50 cursor-pointer"
            >
              {generateCritical.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              Taslagi Uret
            </button>
            <button
              type="button"
              disabled={approveIntake.isPending || !criticalPoint.trim()}
              onClick={handleApproveCritical}
              className="inline-flex items-center gap-1.5 rounded-lg bg-law-accent px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Kritik Noktayi Onayla
            </button>
          </div>
        </CardContent>
      </Card>

      {/* ─── STEP 3: Arastirma ────────────────────── */}
      {criticalApproved && (
        <Card className="border-violet-200 bg-violet-50/40">
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-violet-600" />
                <p className="text-sm font-semibold text-law-primary">Arastirma</p>
              </div>
              <Badge
                variant={
                  researchProfile?.lastRunStatus === 'completed'
                    ? 'success'
                    : researchProfile?.lastRunStatus === 'partial'
                      ? 'warning'
                      : researchProfile?.lastRunStatus === 'failed'
                        ? 'danger'
                        : 'secondary'
                }
              >
                {researchProfile?.lastRunStatus === 'completed'
                  ? 'Tamamlandi'
                  : researchProfile?.lastRunStatus === 'partial'
                    ? 'Kismi'
                    : researchProfile?.lastRunStatus === 'failed'
                      ? 'Hatali'
                      : 'Bekliyor'}
              </Badge>
            </div>

            {/* Research question auto-filled from critical point */}
            <div>
              <label className="mb-1.5 block text-xs font-medium">Arastirma Sorusu</label>
              <textarea
                value={researchQuestion}
                onChange={(e) => setResearchQuestion(e.target.value)}
                rows={3}
                placeholder="Kritik noktadan otomatik olusturulur. Duzenleyebilirsiniz."
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none resize-none"
              />
            </div>

            {/* Source cards — friendly names */}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <SourceCard
                title="Yargi Kararlari"
                description="Yargitay, istinaf ve diger yuksek yargi kararlari"
                icon={Scale}
                enabled={useYargi}
                onToggle={setUseYargi}
                color="border-blue-200 bg-blue-50/40"
                expandable
              >
                <div className="space-y-2">
                  <input
                    value={yargiQuery}
                    onChange={(e) => setYargiQuery(e.target.value)}
                    placeholder="Ozel yargi sorgusu (bos = otomatik)"
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={yargiChamber}
                      onChange={(e) => setYargiChamber(e.target.value)}
                      placeholder="Daire: H9, HGK..."
                      className="rounded-lg border px-3 py-2 text-sm outline-none"
                    />
                    <input
                      type="date"
                      value={yargiDateStart}
                      onChange={(e) => setYargiDateStart(e.target.value)}
                      className="rounded-lg border px-3 py-2 text-sm outline-none"
                    />
                  </div>
                </div>
              </SourceCard>

              <SourceCard
                title="Ilgili Mevzuat"
                description="Kanun, KHK, yonetmelik ve teblig metinleri"
                icon={BookOpen}
                enabled={useMevzuat}
                onToggle={setUseMevzuat}
                color="border-emerald-200 bg-emerald-50/40"
                expandable
              >
                <div className="space-y-2">
                  <input
                    value={mevzuatQuery}
                    onChange={(e) => setMevzuatQuery(e.target.value)}
                    placeholder="Ozel mevzuat sorgusu (bos = otomatik)"
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  />
                  <input
                    value={mevzuatLawNumbers}
                    onChange={(e) => setMevzuatLawNumbers(e.target.value)}
                    placeholder="Kanun no: 4857, 6100"
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  />
                </div>
              </SourceCard>

              <SourceCard
                title="NotebookLM Calisma Alani"
                description="AI'nin dava turuyle ilgili notebook'u inceleyerek bilgi topladi calisma alani"
                icon={Brain}
                enabled={useNotebook}
                onToggle={setUseNotebook}
                color="border-purple-200 bg-purple-50/40"
              >
                {null}
              </SourceCard>

              <SourceCard
                title="Vektor Veritabani"
                description="Ofis kutuphanesi ve onceki dava bilgi tabaninda arama"
                icon={Database}
                enabled={useVector}
                onToggle={setUseVector}
                color="border-orange-200 bg-orange-50/40"
                expandable
              >
                <div className="space-y-2">
                  <input
                    value={vectorCollections}
                    onChange={(e) => setVectorCollections(e.target.value)}
                    placeholder="Koleksiyon: hukuk_genel"
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  />
                  <input
                    value={vectorQuery}
                    onChange={(e) => setVectorQuery(e.target.value)}
                    placeholder="Ozel sorgu (bos = otomatik)"
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  />
                </div>
              </SourceCard>
            </div>

            {/* NotebookLM notebook name input — shown only when enabled */}
            {useNotebook && (
              <div className="rounded-lg border border-purple-200 bg-purple-50/30 p-3">
                <label className="mb-1.5 block text-xs font-medium text-purple-800">
                  NotebookLM Not Defteri Adi
                </label>
                <input
                  value={notebookId}
                  onChange={(e) => setNotebookId(e.target.value)}
                  placeholder="ornek: is hukuku, aile hukuku, tuketici hukuku"
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                />
                <p className="mt-1 text-[11px] text-purple-600">
                  AI bu not defterini calisma alani olarak kullanacak — sorular sorup, icerigi inceleyecek.
                </p>
              </div>
            )}

            {/* Keywords + Action buttons */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <label className="mb-0 block text-xs font-medium shrink-0">Anahtar Kelimeler</label>
                <input
                  value={searchKeywords}
                  onChange={(e) => setSearchKeywords(e.target.value)}
                  placeholder="fazla mesai, ispat yuku, bordro"
                  className="flex-1 rounded-lg border px-3 py-1.5 text-sm outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  disabled={updateResearch.isPending}
                  onClick={handleSaveResearchProfile}
                  className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50 cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" />
                  Profili Kaydet
                </button>

                <div className="flex items-center gap-2">
                  {/* Paralel Araştırma — 4 kaynağı aynı anda çalıştır */}
                  <button
                    type="button"
                    disabled={isResearching || !criticalApproved}
                    onClick={handleRunParallel}
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 text-sm font-medium text-white hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {runResearch.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    Paralel Arastirma
                  </button>

                </div>
              </div>
            </div>

            {/* ─── Loading indicator ───────────────── */}
            {isResearching && (
              <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
                  <div>
                    <p className="text-sm font-medium text-violet-800">
                      Paralel arastirma calistiriliyor...
                    </p>
                    <p className="text-xs text-violet-600">
                      Yargi, mevzuat, NotebookLM ve vektor DB kaynaklari paralel olarak taraniyor...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ─── Global error ────────────────────── */}
            {researchError && !isResearching && (
              <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-800">Arastirma Hatasi</p>
                    <pre className="mt-2 whitespace-pre-wrap text-xs text-red-700 font-mono leading-relaxed">
                      {researchError}
                    </pre>
                  </div>
                  <button
                    type="button"
                    onClick={() => setResearchError(null)}
                    className="rounded-md p-1 text-red-400 hover:text-red-600 cursor-pointer"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ─── Parallel Research Results ──────── */}
            {parallelResult && !isResearching && (
              <div className="space-y-4">
                {/* Summary header */}
                <div className="flex items-center justify-between rounded-xl border bg-card p-3">
                  <div className="flex items-center gap-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Paralel Arastirma Sonuclari
                    </p>
                    {failedSources.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-amber-700">
                        <TriangleAlert className="h-3.5 w-3.5" />
                        {failedSources.length} kaynak hata verdi
                      </div>
                    )}
                  </div>
                  <Badge
                    variant={
                      parallelResult.report.status === 'completed'
                        ? 'success'
                        : parallelResult.report.status === 'partial'
                          ? 'warning'
                          : 'danger'
                    }
                  >
                    {parallelResult.report.status === 'completed'
                      ? 'Tamamlandi'
                      : parallelResult.report.status === 'partial'
                        ? `Kismi (${completedSources.length}/${sourceRuns.filter(s => s.status !== 'skipped').length})`
                        : 'Basarisiz'}
                  </Badge>
                </div>

                {/* Per-source result cards */}
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {sourceRuns
                    .filter((s) => s.status !== 'skipped')
                    .map((source) => (
                      <SourceResultCard
                        key={source.sourceType}
                        source={source}
                        onRetry={
                          source.status === 'failed'
                            ? () => {
                                // Retry whole parallel run for now
                                handleRunParallel()
                              }
                            : undefined
                        }
                        retrying={isResearching}
                      />
                    ))}
                </div>

                {/* Report summary */}
                {parallelResult.report.summary && (
                  <div className="rounded-lg border bg-card/80 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                      Rapor Ozeti
                    </p>
                    <p className="text-sm">{parallelResult.report.summary}</p>
                  </div>
                )}
              </div>
            )}

            {/* ─── Previous run summary (when no fresh result) ── */}
            {!parallelResult && !isResearching && researchProfile?.lastRunSummary && (
              <div className="rounded-xl border bg-card/80 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                  Son Arastirma Sonucu
                </p>
                <p className="text-sm">{researchProfile.lastRunSummary}</p>
                {researchProfile.lastRunAt && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {formatDateTime(researchProfile.lastRunAt)}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── QC Panel ────────────────────────────── */}
      {researchQcData?.qc && (
        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-amber-600" />
                <p className="text-sm font-semibold text-law-primary">Kalite Kontrolu</p>
              </div>
              <Badge
                variant={
                  researchQcData.qc.reviewStepStatus === 'completed'
                    ? 'success'
                    : researchQcData.qc.jobStatus === 'review_required'
                      ? 'warning'
                      : 'secondary'
                }
              >
                {researchQcData.qc.reviewStepStatus === 'completed'
                  ? 'Onaylandi'
                  : researchQcData.qc.jobStatus === 'review_required'
                    ? 'Inceleme Bekliyor'
                    : 'Beklemede'}
              </Badge>
            </div>

            {/* Artifacts */}
            {researchQcData.artifacts?.length > 0 && (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {researchQcData.artifacts.map((artifact: any) => (
                  <div key={artifact.id} className="rounded-lg border bg-card p-3 text-sm">
                    <p className="font-medium text-law-primary">{artifact.title}</p>
                    {artifact.contentPreview && (
                      <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground line-clamp-4">
                        {artifact.contentPreview}
                      </p>
                    )}
                    {artifact.parsedMetadata?.argumentSelections && (
                      <div className="mt-2 space-y-1 border-t pt-2">
                        {Object.entries(
                          artifact.parsedMetadata.argumentSelections as Record<string, boolean>,
                        ).map(([idx, selected]) => (
                          <label key={idx} className="flex items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              checked={!!selected}
                              onChange={(e) =>
                                updateArguments.mutate({
                                  updates: [
                                    {
                                      artifactId: artifact.id,
                                      argumentIndex: Number(idx),
                                      selected: e.target.checked,
                                    },
                                  ],
                                })
                              }
                              className="h-3.5 w-3.5"
                            />
                            Arguman #{Number(idx) + 1}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Reviews */}
            {researchQcData.reviews?.length > 0 && (
              <div className="space-y-2">
                {researchQcData.reviews.map((review: any) => (
                  <div
                    key={review.id}
                    className="flex items-start gap-3 rounded-lg border bg-card p-3 text-xs"
                  >
                    <Badge
                      variant={review.status === 'approved' ? 'success' : 'danger'}
                      className="mt-0.5"
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
              </div>
            )}

            {/* Approve/Reject */}
            {researchQcData.qc.jobStatus === 'review_required' && (
              <div className="space-y-3 rounded-xl border bg-card p-4">
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={2}
                  placeholder="Inceleme notu (opsiyonel)"
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none resize-none"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    disabled={reviewResearch.isPending}
                    onClick={() =>
                      reviewResearch.mutate(
                        { approved: false, reviewNotes },
                        { onSuccess: () => setReviewNotes('') },
                      )
                    }
                    className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 cursor-pointer"
                  >
                    Reddet
                  </button>
                  <button
                    type="button"
                    disabled={reviewResearch.isPending}
                    onClick={() =>
                      reviewResearch.mutate(
                        { approved: true, reviewNotes },
                        { onSuccess: () => setReviewNotes('') },
                      )
                    }
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                  >
                    Onayla — Dilekce Asamasina Gec
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
