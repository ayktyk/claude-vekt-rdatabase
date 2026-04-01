import {
  FileText,
  Scale,
  Search,
  ScrollText,
  Shield,
  Loader2,
  Eye,
  Download,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import ArtifactCard, { type ArtifactStatus } from './ArtifactCard'
import { automationStatusLabels } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CaseInfo {
  automationStatus: string
}

interface BriefingInfo {
  status?: string
  approvedAt?: string | null
  toneStrategy?: string
  markdown?: string
}

interface ProcedureInfo {
  procedureReport?: {
    status?: string
    courtType?: string
    jurisdiction?: string
    arbitrationRequired?: boolean | null
    reportMarkdown?: string
  }
}

interface ResearchQcInfo {
  sourceCount?: number
  conflictCount?: number
  approvedAt?: string | null
}

interface PleadingInfo {
  pleading?: {
    artifact?: { content?: string; createdAt?: string }
    v2Artifact?: { content?: string; createdAt?: string }
    job?: { status?: string }
    reviews?: Array<{ decision: string; notes?: string; createdAt?: string }>
  }
}

interface DefenseInfo {
  defenseSimulation?: {
    artifact?: { content?: string; metadata?: { hasRiskFlag?: boolean } }
    job?: { status?: string }
    review?: { decision?: string }
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AiWorkspaceTabProps {
  caseData: CaseInfo | null
  briefing: BriefingInfo | null
  procedureData: ProcedureInfo | null | undefined
  researchQcData: ResearchQcInfo | null | undefined
  researchApproved: boolean
  pleadingData: PleadingInfo | null | undefined
  defenseData: DefenseInfo | null | undefined
  onNavigateTab: (tab: string) => void
  // Optional mutation triggers
  onExportUdf?: () => void
  exportUdfPending?: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map automation pipeline status to the currently active step (1-based). */
function activeStepFromStatus(status: string): number {
  switch (status) {
    case 'not_started':
    case 'folder_ready':
      return 1
    case 'briefing_ready':
      return 2
    case 'research_ready':
      return 3
    case 'draft_ready':
      return 4
    case 'review_ready':
      return 5
    case 'completed':
      return 6
    default:
      return 1
  }
}

function briefingStatus(b: BriefingInfo | null): ArtifactStatus {
  if (!b) return 'not_started'
  if (b.approvedAt) return 'approved'
  if (b.status === 'generating') return 'in_progress'
  if (b.markdown) return 'draft'
  return 'not_started'
}

function procedureStatus(p: ProcedureInfo | null | undefined): ArtifactStatus {
  const s = p?.procedureReport?.status
  if (!s || s === 'not_started') return 'not_started'
  if (s === 'generating') return 'in_progress'
  if (s === 'approved') return 'approved'
  if (s === 'rejected') return 'rejected'
  if (s === 'draft' || s === 'precheck_done') return 'draft'
  return 'not_started'
}

function researchStatus(approved: boolean, qc: ResearchQcInfo | null | undefined): ArtifactStatus {
  if (approved) return 'approved'
  if (qc?.sourceCount && qc.sourceCount > 0) return 'review_required'
  return 'not_started'
}

function pleadingV1Status(p: PleadingInfo | null | undefined): ArtifactStatus {
  const job = p?.pleading?.job
  const artifact = p?.pleading?.artifact
  if (!job && !artifact) return 'not_started'
  if (job?.status === 'in_progress') return 'in_progress'
  if (artifact) {
    const reviews = p?.pleading?.reviews || []
    const lastReview = reviews[reviews.length - 1]
    if (lastReview?.decision === 'approved') return 'approved'
    if (lastReview?.decision === 'rejected') return 'rejected'
    return 'review_required'
  }
  return 'not_started'
}

function defenseStatus(d: DefenseInfo | null | undefined): ArtifactStatus {
  const job = d?.defenseSimulation?.job
  const artifact = d?.defenseSimulation?.artifact
  if (!job && !artifact) return 'not_started'
  if (job?.status === 'in_progress') return 'in_progress'
  if (job?.status === 'completed' || artifact) {
    const review = d?.defenseSimulation?.review
    if (review?.decision === 'approved') return 'approved'
    if (review?.decision === 'rejected') return 'rejected'
    return review ? 'completed' : 'review_required'
  }
  return 'not_started'
}

function pleadingV2Status(p: PleadingInfo | null | undefined): ArtifactStatus {
  const v2 = p?.pleading?.v2Artifact
  if (!v2) return 'not_started'
  return 'completed'
}

// ---------------------------------------------------------------------------
// Truncate markdown to N chars for preview
// ---------------------------------------------------------------------------
function truncate(text: string | undefined | null, max = 200): string {
  if (!text) return ''
  const clean = text.replace(/^#+\s.*/gm, '').trim()
  return clean.length > max ? clean.slice(0, max) + '…' : clean
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AiWorkspaceTab({
  caseData,
  briefing,
  procedureData,
  researchQcData,
  researchApproved,
  pleadingData,
  defenseData,
  onNavigateTab,
  onExportUdf,
  exportUdfPending,
}: AiWorkspaceTabProps) {
  const autoStatus = caseData?.automationStatus || 'not_started'
  const currentStep = activeStepFromStatus(autoStatus)

  const bStatus = briefingStatus(briefing)
  const pStatus = procedureStatus(procedureData)
  const rStatus = researchStatus(researchApproved, researchQcData)
  const plV1Status = pleadingV1Status(pleadingData)
  const dStatus = defenseStatus(defenseData)
  const plV2Status = pleadingV2Status(pleadingData)

  // Risk flag from defense simulation
  const hasRiskFlag = defenseData?.defenseSimulation?.artifact?.metadata?.hasRiskFlag

  return (
    <div className="space-y-6">
      {/* Pipeline overview */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-law-primary">AI Otomasyon Durumu</p>
              <p className="text-xs text-muted-foreground">
                Davanın yapay zeka destekli iş akışının genel görünümü.
              </p>
            </div>
            <Badge
              variant={
                autoStatus === 'completed'
                  ? 'success'
                  : autoStatus === 'not_started'
                    ? 'outline'
                    : 'warning'
              }
            >
              {automationStatusLabels[autoStatus] || autoStatus}
            </Badge>
          </div>

          {/* Step progress bar */}
          <div className="mt-4 flex items-center gap-1">
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  s <= currentStep
                    ? s === currentStep
                      ? 'bg-law-accent'
                      : 'bg-emerald-400'
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>Briefing</span>
            <span>Usul</span>
            <span>Araştırma</span>
            <span>Dilekçe v1</span>
            <span>Savunma</span>
            <span>Final</span>
          </div>
        </CardContent>
      </Card>

      {/* Risk flag alert */}
      {hasRiskFlag && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <Shield className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <strong>Risk Uyarısı:</strong> Savunma simülasyonunda kritik risk tespit edildi.
            Dilekçeyi finalize etmeden önce savunma raporunu inceleyin.
          </span>
        </div>
      )}

      {/* Artifact cards grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 1. Briefing */}
        <ArtifactCard
          icon={FileText}
          title="Briefing"
          description="Dava özeti, kritik nokta ve avukat yönlendirmesi."
          status={bStatus}
          step={1}
          active={currentStep === 1}
          summary={truncate(briefing?.toneStrategy) || truncate(briefing?.markdown)}
          actions={
            <NavButton label="Detay" onClick={() => onNavigateTab('research')} />
          }
        />

        {/* 2. Usul Raporu */}
        <ArtifactCard
          icon={Scale}
          title="Usul Raporu"
          description="Görevli mahkeme, zamanaşımı, arabuluculuk, harç."
          status={pStatus}
          step={2}
          active={currentStep === 2}
          summary={
            procedureData?.procedureReport?.courtType
              ? `Mahkeme: ${procedureData.procedureReport.courtType}${
                  procedureData.procedureReport.jurisdiction
                    ? ` | Yetki: ${procedureData.procedureReport.jurisdiction}`
                    : ''
                }${
                  procedureData.procedureReport.arbitrationRequired
                    ? ' | Arabuluculuk: Zorunlu'
                    : ''
                }`
              : undefined
          }
          actions={
            <NavButton label="Detay" onClick={() => onNavigateTab('procedure')} />
          }
        />

        {/* 3. Araştırma */}
        <ArtifactCard
          icon={Search}
          title="Araştırma Raporu"
          description="Kritik nokta araştırması — yargı, mevzuat, vektör DB."
          status={rStatus}
          step={3}
          active={currentStep === 3}
          summary={
            researchQcData?.sourceCount
              ? `${researchQcData.sourceCount} kaynak bulundu${
                  researchQcData.conflictCount
                    ? `, ${researchQcData.conflictCount} çelişki`
                    : ''
                }`
              : undefined
          }
          actions={
            <NavButton label="Detay" onClick={() => onNavigateTab('research')} />
          }
        >
          {researchQcData?.conflictCount != null && researchQcData.conflictCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-amber-600">
              <Sparkles className="h-3 w-3" />
              {researchQcData.conflictCount} çelişkili kaynak — doğrulama gerekli
            </div>
          )}
        </ArtifactCard>

        {/* 4. Dilekçe v1 */}
        <ArtifactCard
          icon={ScrollText}
          title="Dilekçe Taslağı (v1)"
          description="AI ile üretilen ilk dilekçe taslağı."
          status={plV1Status}
          step={4}
          active={currentStep === 4}
          summary={truncate(pleadingData?.pleading?.artifact?.content)}
          actions={
            <NavButton label="Detay" onClick={() => onNavigateTab('pleading')} />
          }
        />

        {/* 5. Savunma Simülasyonu */}
        <ArtifactCard
          icon={Shield}
          title="Savunma Simülasyonu"
          description="Karşı taraf perspektifinden en güçlü savunmaların analizi."
          status={dStatus}
          step={5}
          active={currentStep === 5}
          summary={truncate(defenseData?.defenseSimulation?.artifact?.content)}
          actions={
            <NavButton label="Detay" onClick={() => onNavigateTab('defense')} />
          }
        >
          {hasRiskFlag && (
            <div className="flex items-center gap-1 text-xs text-red-600">
              <Shield className="h-3 w-3" />
              Kritik risk tespit edildi
            </div>
          )}
        </ArtifactCard>

        {/* 6. Dilekçe v2 / Final */}
        <ArtifactCard
          icon={ScrollText}
          title="Dilekçe Final (v2)"
          description="Savunma simülasyonu sonrası revize edilmiş dilekçe."
          status={plV2Status}
          step={6}
          active={currentStep >= 6}
          summary={truncate(pleadingData?.pleading?.v2Artifact?.content)}
          actions={
            <>
              <NavButton label="Detay" onClick={() => onNavigateTab('pleading')} />
              {onExportUdf && plV2Status === 'completed' && (
                <button
                  type="button"
                  disabled={exportUdfPending}
                  onClick={onExportUdf}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {exportUdfPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Download className="h-3 w-3" />
                  )}
                  UDF İndir
                </button>
              )}
            </>
          }
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Small helper components
// ---------------------------------------------------------------------------

function NavButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-law-accent/30 px-3 py-1.5 text-xs font-medium text-law-accent hover:bg-law-accent/5 transition-colors"
    >
      <Eye className="h-3 w-3" />
      {label}
    </button>
  )
}
