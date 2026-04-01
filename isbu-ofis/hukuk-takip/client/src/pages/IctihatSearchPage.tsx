import { useState, useMemo, useCallback, useRef } from 'react'
import {
  Search,
  Info,
  Scale,
  Landmark,
  CalendarDays,
  Bookmark,
  Briefcase,
  Users,
  Shield,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Filter,
  Loader2,
  FileText,
  ExternalLink,
  AlertCircle,
  Sparkles,
  BookOpen,
  Brain,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import api from '@/lib/axios'
import {
  COURT_TYPES,
  LEGAL_BRANCHES,
  QUICK_FILTERS,
  SEARCH_TIPS,
  getDepartmentsForCourt,
  type QuickFilter,
  type Department,
} from '@/lib/constants/courtData'

// ─── Icon mapping ──────────────────────────────────────────

const QUICK_FILTER_ICONS: Record<string, React.ReactNode> = {
  scale: <Scale className="h-3.5 w-3.5" />,
  landmark: <Landmark className="h-3.5 w-3.5" />,
  calendar: <CalendarDays className="h-3.5 w-3.5" />,
  bookmark: <Bookmark className="h-3.5 w-3.5" />,
  briefcase: <Briefcase className="h-3.5 w-3.5" />,
  users: <Users className="h-3.5 w-3.5" />,
  shield: <Shield className="h-3.5 w-3.5" />,
}

// ─── Types ────────────────────────────────────────────────

interface SearchForm {
  searchTerm: string
  courtType: string
  department: string
  yearFrom: string
  yearTo: string
  legalBranch: string
}

interface YargiDecision {
  documentId: string
  birimAdi?: string | null
  esasNo?: string | null
  kararNo?: string | null
  kararTarihiStr?: string | null
}

interface YargiSearchResponse {
  decisions: YargiDecision[]
  totalCount?: number
}

interface MevzuatResult {
  mevzuatId: string
  mevzuatAdi: string
  mevzuatTuru?: string | null
  mevzuatNo?: string | null
  resmiGazeteTarihi?: string | null
}

interface MevzuatSearchResponse {
  results: MevzuatResult[]
  totalCount?: number
}

interface MevzuatForm {
  searchTerm: string
  legislationType: string
  legislationNo: string
}

interface ResearchForm {
  caseTitle: string
  caseType: string
  criticalPoint: string
}

interface ResearchResponse {
  reportMarkdown: string
  sources?: Array<{ sourceType: string; status: string; summary?: string }>
}

const INITIAL_FORM: SearchForm = {
  searchTerm: '',
  courtType: '',
  department: '',
  yearFrom: '',
  yearTo: '',
  legalBranch: '',
}

const INITIAL_MEVZUAT_FORM: MevzuatForm = {
  searchTerm: '',
  legislationType: '',
  legislationNo: '',
}

const INITIAL_RESEARCH_FORM: ResearchForm = {
  caseTitle: '',
  caseType: '',
  criticalPoint: '',
}

const LEGISLATION_TYPES = [
  { id: 'KANUN', label: 'Kanun' },
  { id: 'KHK', label: 'Kanun Hukmunde Kararname' },
  { id: 'TUZUK', label: 'Tuzuk' },
  { id: 'YONETMELIK', label: 'Yonetmelik' },
  { id: 'TEBLIG', label: 'Teblig' },
  { id: 'CBK', label: 'Cumhurbaskanligi Kararnamesi' },
]

const PAGE_SIZE = 20

// ─── Component ─────────────────────────────────────────────

export default function IctihatSearchPage() {
  // --- Yargi tab state ---
  const [form, setForm] = useState<SearchForm>(INITIAL_FORM)
  const [activeQuickFilters, setActiveQuickFilters] = useState<Set<string>>(new Set())
  const [showTips, setShowTips] = useState(false)

  const [yargiResults, setYargiResults] = useState<YargiDecision[]>([])
  const [yargiTotal, setYargiTotal] = useState(0)
  const [yargiLoading, setYargiLoading] = useState(false)
  const [yargiError, setYargiError] = useState<string | null>(null)
  const [yargiSearched, setYargiSearched] = useState(false)
  const [yargiPage, setYargiPage] = useState(0)

  // --- Document modal state ---
  const [docModalOpen, setDocModalOpen] = useState(false)
  const [docContent, setDocContent] = useState<string>('')
  const [docTitle, setDocTitle] = useState<string>('')
  const [docLoading, setDocLoading] = useState(false)

  // --- Mevzuat tab state ---
  const [mevzuatForm, setMevzuatForm] = useState<MevzuatForm>(INITIAL_MEVZUAT_FORM)
  const [mevzuatResults, setMevzuatResults] = useState<MevzuatResult[]>([])
  const [mevzuatTotal, setMevzuatTotal] = useState(0)
  const [mevzuatLoading, setMevzuatLoading] = useState(false)
  const [mevzuatError, setMevzuatError] = useState<string | null>(null)
  const [mevzuatSearched, setMevzuatSearched] = useState(false)

  const [mevzuatDocModalOpen, setMevzuatDocModalOpen] = useState(false)
  const [mevzuatDocContent, setMevzuatDocContent] = useState<string>('')
  const [mevzuatDocTitle, setMevzuatDocTitle] = useState<string>('')
  const [mevzuatDocLoading, setMevzuatDocLoading] = useState(false)

  // --- AI Research tab state ---
  const [researchForm, setResearchForm] = useState<ResearchForm>(INITIAL_RESEARCH_FORM)
  const [researchReport, setResearchReport] = useState<string>('')
  const [researchSources, setResearchSources] = useState<ResearchResponse['sources']>([])
  const [researchLoading, setResearchLoading] = useState(false)
  const [researchError, setResearchError] = useState<string | null>(null)
  const [researchCompleted, setResearchCompleted] = useState(false)

  // Abort controller ref for cancelling in-flight requests
  const abortRef = useRef<AbortController | null>(null)

  // Available departments based on selected court
  const availableDepartments: Department[] = useMemo(
    () => (form.courtType ? getDepartmentsForCourt(form.courtType) : []),
    [form.courtType]
  )

  const currentYear = new Date().getFullYear()

  // ─── Yargi Search Handlers ─────────────────────────────

  const updateField = useCallback(
    <K extends keyof SearchForm>(key: K, value: SearchForm[K]) => {
      setForm((prev) => {
        const next = { ...prev, [key]: value }
        if (key === 'courtType' && value !== prev.courtType) {
          next.department = ''
        }
        return next
      })
    },
    []
  )

  const handleYargiSearch = useCallback(
    async (e?: React.FormEvent, page = 0) => {
      e?.preventDefault()
      const term = form.searchTerm.trim()
      if (!term) return

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setYargiLoading(true)
      setYargiError(null)
      setYargiSearched(true)
      setYargiPage(page)

      try {
        const court = COURT_TYPES.find((c) => c.id === form.courtType)
        const departments = form.courtType ? getDepartmentsForCourt(form.courtType) : []
        const dept = departments.find((d) => d.id === form.department)

        const payload: Record<string, unknown> = {
          searchTerm: term,
          offset: page * PAGE_SIZE,
          limit: PAGE_SIZE,
        }
        if (court) payload.courtType = court.cliFlag
        if (dept) payload.chamber = dept.cliFlag
        if (form.yearFrom) payload.dateStart = `${form.yearFrom}-01-01`
        if (form.yearTo) payload.dateEnd = `${form.yearTo}-12-31`

        const res = await api.post<YargiSearchResponse>(
          '/ictihat/search',
          payload,
          { signal: controller.signal }
        )

        setYargiResults(res.data.decisions || [])
        setYargiTotal(res.data.totalCount ?? res.data.decisions?.length ?? 0)
      } catch (err: unknown) {
        if ((err as { name?: string })?.name === 'CanceledError') return
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Arama sirasinda bir hata olustu.'
        setYargiError(msg)
        setYargiResults([])
        setYargiTotal(0)
      } finally {
        setYargiLoading(false)
      }
    },
    [form]
  )

  const handleReset = useCallback(() => {
    setForm(INITIAL_FORM)
    setActiveQuickFilters(new Set())
    setYargiResults([])
    setYargiTotal(0)
    setYargiError(null)
    setYargiSearched(false)
    setYargiPage(0)
  }, [])

  const handleQuickFilter = useCallback(
    (filter: QuickFilter) => {
      setActiveQuickFilters((prev) => {
        const next = new Set(prev)
        if (next.has(filter.id)) {
          next.delete(filter.id)
        } else {
          next.add(filter.id)
        }
        return next
      })

      setForm((prev) => {
        const next = { ...prev }
        if (filter.apply.courtType) next.courtType = filter.apply.courtType
        if (filter.apply.department) next.department = filter.apply.department
        if (filter.apply.yearFrom) next.yearFrom = String(filter.apply.yearFrom)
        if (filter.apply.searchTerm) {
          next.searchTerm = prev.searchTerm
            ? `${prev.searchTerm} ${filter.apply.searchTerm}`
            : filter.apply.searchTerm
        }
        return next
      })
    },
    []
  )

  const handleFetchDocument = useCallback(async (decision: YargiDecision) => {
    setDocModalOpen(true)
    setDocLoading(true)
    setDocContent('')
    setDocTitle(
      [decision.birimAdi, decision.esasNo, decision.kararNo]
        .filter(Boolean)
        .join(' - ') || 'Karar Detayi'
    )

    try {
      const res = await api.get<{ markdownContent?: string; sourceUrl?: string }>(
        `/ictihat/doc/${encodeURIComponent(decision.documentId)}`
      )
      setDocContent(res.data.markdownContent || 'Icerik bulunamadi.')
    } catch {
      setDocContent('Belge yuklenirken bir hata olustu. Lutfen tekrar deneyin.')
    } finally {
      setDocLoading(false)
    }
  }, [])

  // ─── Mevzuat Search Handlers ───────────────────────────

  const handleMevzuatSearch = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault()
      const term = mevzuatForm.searchTerm.trim()
      if (!term) return

      setMevzuatLoading(true)
      setMevzuatError(null)
      setMevzuatSearched(true)

      try {
        const payload: Record<string, unknown> = { searchTerm: term }
        if (mevzuatForm.legislationType) payload.legislationType = mevzuatForm.legislationType
        if (mevzuatForm.legislationNo) payload.legislationNo = mevzuatForm.legislationNo

        const res = await api.post<MevzuatSearchResponse>('/mevzuat/search', payload)
        setMevzuatResults(res.data.results || [])
        setMevzuatTotal(res.data.totalCount ?? res.data.results?.length ?? 0)
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Mevzuat aramasi sirasinda bir hata olustu.'
        setMevzuatError(msg)
        setMevzuatResults([])
        setMevzuatTotal(0)
      } finally {
        setMevzuatLoading(false)
      }
    },
    [mevzuatForm]
  )

  const handleFetchMevzuatDoc = useCallback(async (result: MevzuatResult) => {
    setMevzuatDocModalOpen(true)
    setMevzuatDocLoading(true)
    setMevzuatDocContent('')
    setMevzuatDocTitle(result.mevzuatAdi || 'Mevzuat Detayi')

    try {
      const res = await api.get<{ content?: string }>(
        `/mevzuat/doc/${encodeURIComponent(result.mevzuatId)}`
      )
      setMevzuatDocContent(res.data.content || 'Icerik bulunamadi.')
    } catch {
      setMevzuatDocContent('Belge yuklenirken bir hata olustu.')
    } finally {
      setMevzuatDocLoading(false)
    }
  }, [])

  // ─── AI Research Handlers ──────────────────────────────

  const handleResearchSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault()
      if (!researchForm.criticalPoint.trim()) return

      setResearchLoading(true)
      setResearchError(null)
      setResearchCompleted(false)
      setResearchReport('')
      setResearchSources([])

      try {
        const savedKey = localStorage.getItem('anthropic_api_key') || undefined
        const res = await api.post<ResearchResponse>('/ictihat/research', {
          caseTitle: researchForm.caseTitle.trim() || undefined,
          caseType: researchForm.caseType.trim() || undefined,
          criticalPoint: researchForm.criticalPoint.trim(),
          anthropicApiKey: savedKey,
        })

        setResearchReport(res.data.reportMarkdown || '')
        setResearchSources(res.data.sources || [])
        setResearchCompleted(true)
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'AI arastirma sirasinda bir hata olustu.'
        setResearchError(msg)
      } finally {
        setResearchLoading(false)
      }
    },
    [researchForm]
  )

  // ─── Pagination helpers ────────────────────────────────

  const totalPages = Math.ceil(yargiTotal / PAGE_SIZE)
  const hasNextPage = yargiPage < totalPages - 1
  const hasPrevPage = yargiPage > 0

  // ─── Render ────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ictihat ve Mevzuat Arama"
        description="Yargi kararlari, mevzuat ve AI destekli hukuki arastirma"
      />

      <Tabs defaultValue="yargi" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="yargi" className="gap-1.5">
            <Scale className="h-4 w-4" />
            Yargi Kararlari
          </TabsTrigger>
          <TabsTrigger value="mevzuat" className="gap-1.5">
            <BookOpen className="h-4 w-4" />
            Mevzuat
          </TabsTrigger>
          <TabsTrigger value="research" className="gap-1.5">
            <Brain className="h-4 w-4" />
            AI Arastirma
          </TabsTrigger>
        </TabsList>

        {/* ════════════════════════════════════════════════════
            TAB 1: YARGI KARARLARI
            ════════════════════════════════════════════════════ */}
        <TabsContent value="yargi" className="space-y-4">
          {/* Quick Filters */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Hizli Filtreler</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_FILTERS.map((filter) => {
                const isActive = activeQuickFilters.has(filter.id)
                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => handleQuickFilter(filter)}
                    title={filter.description}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {QUICK_FILTER_ICONS[filter.icon] || null}
                    {filter.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Search Form */}
          <form onSubmit={handleYargiSearch} className="space-y-4 rounded-lg border bg-card p-6">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Arama Kriterleri</h2>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Temizle
              </button>
            </div>

            {/* Search Term */}
            <div>
              <label htmlFor="searchTerm" className="mb-1 block text-sm font-medium text-foreground">
                Arama Terimi <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="searchTerm"
                  type="text"
                  value={form.searchTerm}
                  onChange={(e) => updateField('searchTerm', e.target.value)}
                  placeholder="Ornegin: fazla mesai ispat yuku imzali bordro"
                  className="w-full rounded-md border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Spesifik hukuki kavramlar kullanin. Genel terimler cok fazla sonuc dondurur.
              </p>
            </div>

            {/* Court Type + Department */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="courtType" className="mb-1 block text-sm font-medium text-foreground">
                  Mahkeme Turu
                </label>
                <select
                  id="courtType"
                  value={form.courtType}
                  onChange={(e) => updateField('courtType', e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Tum Mahkemeler</option>
                  {COURT_TYPES.map((ct) => (
                    <option key={ct.id} value={ct.id}>{ct.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="department" className="mb-1 block text-sm font-medium text-foreground">
                  Daire
                </label>
                <select
                  id="department"
                  value={form.department}
                  onChange={(e) => updateField('department', e.target.value)}
                  disabled={!form.courtType || availableDepartments.length === 0}
                  className="w-full rounded-md border bg-background px-3 py-2.5 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Tum Daireler</option>
                  {availableDepartments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.label}</option>
                  ))}
                </select>
                {!form.courtType && (
                  <p className="mt-1 text-xs text-muted-foreground">Once mahkeme turu secin.</p>
                )}
              </div>
            </div>

            {/* Year Range + Legal Branch */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="yearFrom" className="mb-1 block text-sm font-medium text-foreground">
                  Yil Baslangic
                </label>
                <input
                  id="yearFrom"
                  type="number"
                  min={1990}
                  max={currentYear}
                  value={form.yearFrom}
                  onChange={(e) => updateField('yearFrom', e.target.value)}
                  placeholder="2020"
                  className="w-full rounded-md border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label htmlFor="yearTo" className="mb-1 block text-sm font-medium text-foreground">
                  Yil Bitis
                </label>
                <input
                  id="yearTo"
                  type="number"
                  min={1990}
                  max={currentYear}
                  value={form.yearTo}
                  onChange={(e) => updateField('yearTo', e.target.value)}
                  placeholder={String(currentYear)}
                  className="w-full rounded-md border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label htmlFor="legalBranch" className="mb-1 block text-sm font-medium text-foreground">
                  Hukuk Dali
                </label>
                <select
                  id="legalBranch"
                  value={form.legalBranch}
                  onChange={(e) => updateField('legalBranch', e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Tumu</option>
                  {LEGAL_BRANCHES.map((lb) => (
                    <option key={lb.id} value={lb.id}>{lb.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Legal Branch Keywords Hint */}
            {form.legalBranch && (
              <div className="rounded-md bg-muted/50 px-3 py-2">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Onerilen anahtar kelimeler: </span>
                  {LEGAL_BRANCHES.find((b) => b.id === form.legalBranch)?.keywords.join(', ') || ''}
                </p>
              </div>
            )}

            {/* Submit */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={!form.searchTerm.trim() || yargiLoading}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {yargiLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                {yargiLoading ? 'Araniyor...' : 'Ara'}
              </button>
            </div>
          </form>

          {/* Yargi Results Area */}
          {yargiLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-3 text-sm text-muted-foreground">Kararlar araniyor...</p>
            </div>
          )}

          {yargiError && !yargiLoading && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/30">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">Arama Hatasi</p>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-400">{yargiError}</p>
                  <button
                    type="button"
                    onClick={() => handleYargiSearch(undefined, yargiPage)}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 dark:border-red-800 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Tekrar Dene
                  </button>
                </div>
              </div>
            </div>
          )}

          {yargiSearched && !yargiLoading && !yargiError && yargiResults.length === 0 && (
            <EmptyState
              icon={Search}
              title="Sonuc bulunamadi"
              description="Arama kriterlerinize uygun karar bulunamadi. Farkli terimler veya filtreler deneyin."
              action={
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Filtreleri Temizle
                </button>
              }
            />
          )}

          {!yargiLoading && !yargiError && yargiResults.length > 0 && (
            <div className="space-y-3">
              {/* Result count */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">Sonuclar</h3>
                  <Badge variant="secondary">{yargiTotal} karar</Badge>
                </div>
                {totalPages > 1 && (
                  <span className="text-xs text-muted-foreground">
                    Sayfa {yargiPage + 1} / {totalPages}
                  </span>
                )}
              </div>

              {/* Result cards */}
              <div className="space-y-2">
                {yargiResults.map((decision) => (
                  <div
                    key={decision.documentId}
                    className="group flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {decision.birimAdi && (
                          <Badge variant="outline" className="text-xs">
                            {decision.birimAdi}
                          </Badge>
                        )}
                        {decision.kararTarihiStr && (
                          <span className="text-xs text-muted-foreground">
                            {decision.kararTarihiStr}
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground">
                        {decision.esasNo && (
                          <span>
                            <span className="text-muted-foreground">Esas: </span>
                            {decision.esasNo}
                          </span>
                        )}
                        {decision.kararNo && (
                          <span>
                            <span className="text-muted-foreground">Karar: </span>
                            {decision.kararNo}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFetchDocument(decision)}
                      className="ml-4 inline-flex flex-shrink-0 items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-foreground opacity-0 transition-all hover:bg-primary hover:text-primary-foreground group-hover:opacity-100"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Tam Metin
                    </button>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    disabled={!hasPrevPage}
                    onClick={() => handleYargiSearch(undefined, yargiPage - 1)}
                    className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Onceki
                  </button>
                  <span className="text-xs text-muted-foreground">
                    {yargiPage + 1} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={!hasNextPage}
                    onClick={() => handleYargiSearch(undefined, yargiPage + 1)}
                    className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Sonraki
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tips section (shown when no search has been done) */}
          {!yargiSearched && (
            <div className="rounded-lg border bg-card p-6">
              <button
                type="button"
                onClick={() => setShowTips(!showTips)}
                className="flex w-full items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  <h2 className="text-base font-semibold text-foreground">
                    Etkili Ictihat Aramasi Icin Ipuclari
                  </h2>
                </div>
                {showTips ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>

              {showTips && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {SEARCH_TIPS.map((tip, idx) => (
                    <div key={idx} className="rounded-md border bg-background p-3">
                      <h4 className="text-sm font-medium text-foreground">{tip.title}</h4>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {tip.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {!showTips && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Arama formunu doldurup &quot;Ara&quot; butonuna tiklayin. Sonuclar asagida
                  listelenecektir.
                </p>
              )}
            </div>
          )}
        </TabsContent>

        {/* ════════════════════════════════════════════════════
            TAB 2: MEVZUAT
            ════════════════════════════════════════════════════ */}
        <TabsContent value="mevzuat" className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-medium">Mevzuat Arama</p>
              <p className="mt-1">
                Kanun, KHK, yonetmelik ve tebligleri anahtar kelime ile arayin.
                Kanun numarasi yerine icerik terimleri kullanmak daha isabetli sonuc verir.
              </p>
            </div>
          </div>

          <form onSubmit={handleMevzuatSearch} className="space-y-4 rounded-lg border bg-card p-6">
            <h2 className="text-base font-semibold text-foreground">Mevzuat Arama Kriterleri</h2>

            <div>
              <label htmlFor="mevzuatSearchTerm" className="mb-1 block text-sm font-medium text-foreground">
                Arama Terimi <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="mevzuatSearchTerm"
                  type="text"
                  value={mevzuatForm.searchTerm}
                  onChange={(e) => setMevzuatForm((p) => ({ ...p, searchTerm: e.target.value }))}
                  placeholder="Ornegin: is kanunu, katma deger vergisi, tuketici haklari"
                  className="w-full rounded-md border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="legislationType" className="mb-1 block text-sm font-medium text-foreground">
                  Mevzuat Turu
                </label>
                <select
                  id="legislationType"
                  value={mevzuatForm.legislationType}
                  onChange={(e) => setMevzuatForm((p) => ({ ...p, legislationType: e.target.value }))}
                  className="w-full rounded-md border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Tumu</option>
                  {LEGISLATION_TYPES.map((lt) => (
                    <option key={lt.id} value={lt.id}>{lt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="legislationNo" className="mb-1 block text-sm font-medium text-foreground">
                  Mevzuat Numarasi
                </label>
                <input
                  id="legislationNo"
                  type="text"
                  value={mevzuatForm.legislationNo}
                  onChange={(e) => setMevzuatForm((p) => ({ ...p, legislationNo: e.target.value }))}
                  placeholder="Ornegin: 4857"
                  className="w-full rounded-md border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={!mevzuatForm.searchTerm.trim() || mevzuatLoading}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {mevzuatLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                {mevzuatLoading ? 'Araniyor...' : 'Mevzuat Ara'}
              </button>
            </div>
          </form>

          {/* Mevzuat Results */}
          {mevzuatLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-3 text-sm text-muted-foreground">Mevzuat araniyor...</p>
            </div>
          )}

          {mevzuatError && !mevzuatLoading && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/30">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">Arama Hatasi</p>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-400">{mevzuatError}</p>
                  <button
                    type="button"
                    onClick={() => handleMevzuatSearch()}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 dark:border-red-800 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Tekrar Dene
                  </button>
                </div>
              </div>
            </div>
          )}

          {mevzuatSearched && !mevzuatLoading && !mevzuatError && mevzuatResults.length === 0 && (
            <EmptyState
              icon={BookOpen}
              title="Sonuc bulunamadi"
              description="Arama kriterlerinize uygun mevzuat bulunamadi. Farkli terimler deneyin."
            />
          )}

          {!mevzuatLoading && !mevzuatError && mevzuatResults.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">Sonuclar</h3>
                <Badge variant="secondary">{mevzuatTotal} mevzuat</Badge>
              </div>

              <div className="space-y-2">
                {mevzuatResults.map((result) => (
                  <div
                    key={result.mevzuatId}
                    className="group flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{result.mevzuatAdi}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        {result.mevzuatTuru && (
                          <Badge variant="outline" className="text-xs">
                            {result.mevzuatTuru}
                          </Badge>
                        )}
                        {result.mevzuatNo && (
                          <span className="text-xs text-muted-foreground">
                            No: {result.mevzuatNo}
                          </span>
                        )}
                        {result.resmiGazeteTarihi && (
                          <span className="text-xs text-muted-foreground">
                            RG: {result.resmiGazeteTarihi}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFetchMevzuatDoc(result)}
                      className="ml-4 inline-flex flex-shrink-0 items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-foreground opacity-0 transition-all hover:bg-primary hover:text-primary-foreground group-hover:opacity-100"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Tam Metin
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ════════════════════════════════════════════════════
            TAB 3: AI ARASTIRMA
            ════════════════════════════════════════════════════ */}
        <TabsContent value="research" className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-900 dark:bg-purple-950/30">
            <Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-600 dark:text-purple-400" />
            <div className="text-sm text-purple-800 dark:text-purple-300">
              <p className="font-medium">AI Destekli Arastirma</p>
              <p className="mt-1">
                Kritik noktanizi girin, sistem yargi kararlari, mevzuat ve vektor veritabanindan
                orkestre bir arastirma raporu uretsin. Bu islem birden fazla kaynagi paralel tarar
                ve birlesik bir rapor sunar.
              </p>
            </div>
          </div>

          <form onSubmit={handleResearchSubmit} className="space-y-4 rounded-lg border bg-card p-6">
            <h2 className="text-base font-semibold text-foreground">Arastirma Parametreleri</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="researchCaseTitle" className="mb-1 block text-sm font-medium text-foreground">
                  Dava Basligi
                </label>
                <input
                  id="researchCaseTitle"
                  type="text"
                  value={researchForm.caseTitle}
                  onChange={(e) => setResearchForm((p) => ({ ...p, caseTitle: e.target.value }))}
                  placeholder="Ornegin: Ahmet Yilmaz - Iscilik Alacagi"
                  className="w-full rounded-md border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label htmlFor="researchCaseType" className="mb-1 block text-sm font-medium text-foreground">
                  Dava Turu
                </label>
                <select
                  id="researchCaseType"
                  value={researchForm.caseType}
                  onChange={(e) => setResearchForm((p) => ({ ...p, caseType: e.target.value }))}
                  className="w-full rounded-md border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Sec...</option>
                  {LEGAL_BRANCHES.map((lb) => (
                    <option key={lb.id} value={lb.id}>{lb.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="criticalPoint" className="mb-1 block text-sm font-medium text-foreground">
                Kritik Nokta <span className="text-red-500">*</span>
              </label>
              <textarea
                id="criticalPoint"
                rows={3}
                value={researchForm.criticalPoint}
                onChange={(e) => setResearchForm((p) => ({ ...p, criticalPoint: e.target.value }))}
                placeholder="Arastirilmasini istediginiz spesifik hukuki meseleyi yazin. Ornegin: Odenmemis fazla mesai nedeniyle iscinin istifasinin hakli fesih sayilarak kidem tazminatina hak kazanip kazanmadigi."
                className="w-full rounded-md border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Ne kadar spesifik yazarsaniz, rapor o kadar isabetli olur.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={!researchForm.criticalPoint.trim() || researchLoading}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {researchLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Brain className="h-4 w-4" />
                )}
                {researchLoading ? 'Arastirma Yapiliyor...' : 'Arastirmayi Baslat'}
              </button>
              {researchLoading && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Bu islem birden fazla kaynagi taradigindan 30-90 saniye surebilir.
                </p>
              )}
            </div>
          </form>

          {/* Research Loading */}
          {researchLoading && (
            <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="mt-4 text-sm font-medium text-foreground">AI Arastirma Devam Ediyor</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Yargi, mevzuat ve vektor veritabani paralel taraniyor...
              </p>
              <div className="mt-4 flex items-center gap-3">
                {['Yargi MCP', 'Mevzuat MCP', 'Vektor DB'].map((src) => (
                  <div
                    key={src}
                    className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                  >
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {src}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Research Error */}
          {researchError && !researchLoading && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/30">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">Arastirma Hatasi</p>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-400">{researchError}</p>
                  <button
                    type="button"
                    onClick={() => handleResearchSubmit()}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 dark:border-red-800 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Tekrar Dene
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Research Report */}
          {researchCompleted && !researchLoading && researchReport && (
            <div className="space-y-4">
              {/* Source summary badges */}
              {researchSources && researchSources.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Kaynaklar:</span>
                  {researchSources.map((src, idx) => (
                    <Badge
                      key={idx}
                      variant={
                        src.status === 'completed' || src.status === 'success'
                          ? 'success'
                          : src.status === 'skipped'
                          ? 'secondary'
                          : 'warning'
                      }
                      className="text-xs"
                    >
                      {src.sourceType}
                      {src.summary && (
                        <span className="ml-1 opacity-75">- {src.summary}</span>
                      )}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Report content */}
              <div className="rounded-lg border bg-card">
                <div className="flex items-center justify-between border-b px-6 py-3">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">Arastirma Raporu</h3>
                  </div>
                  <Badge variant="outline" className="text-xs">TASLAK</Badge>
                </div>
                <div className="p-6">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                    {researchReport}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ════════════════════════════════════════════════════
          YARGI DOCUMENT MODAL
          ════════════════════════════════════════════════════ */}
      <Dialog open={docModalOpen} onOpenChange={setDocModalOpen}>
        <DialogContent className="max-h-[85vh] max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 pr-8 text-base">
              <FileText className="h-4 w-4 flex-shrink-0 text-primary" />
              <span className="truncate">{docTitle}</span>
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh]">
            {docLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="mt-2 text-sm text-muted-foreground">Belge yukleniyor...</p>
              </div>
            ) : (
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                {docContent}
              </pre>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════
          MEVZUAT DOCUMENT MODAL
          ════════════════════════════════════════════════════ */}
      <Dialog open={mevzuatDocModalOpen} onOpenChange={setMevzuatDocModalOpen}>
        <DialogContent className="max-h-[85vh] max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 pr-8 text-base">
              <BookOpen className="h-4 w-4 flex-shrink-0 text-primary" />
              <span className="truncate">{mevzuatDocTitle}</span>
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh]">
            {mevzuatDocLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="mt-2 text-sm text-muted-foreground">Mevzuat yukleniyor...</p>
              </div>
            ) : (
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                {mevzuatDocContent}
              </pre>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
