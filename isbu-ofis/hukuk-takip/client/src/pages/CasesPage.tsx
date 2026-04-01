import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCases, useDeleteCase } from '@/hooks/useCases'
import {
  formatDate,
  caseStatusLabels,
  caseTypeLabels,
  automationStatusLabels,
} from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Scale,
  Plus,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  Bot,
} from 'lucide-react'

const statusVariant: Record<string, 'default' | 'success' | 'danger' | 'warning' | 'secondary'> = {
  active: 'default',
  istinafta: 'warning',
  'yargıtayda': 'warning',
  won: 'success',
  lost: 'danger',
  settled: 'warning',
  closed: 'secondary',
  passive: 'secondary',
}

const statusOptions = [
  { value: '', label: 'Tüm Durumlar' },
  { value: 'active', label: 'Aktif' },
  { value: 'istinafta', label: 'İstinafta' },
  { value: 'yargıtayda', label: 'Yargıtayda' },
  { value: 'passive', label: 'Pasif' },
  { value: 'won', label: 'Kazanıldı' },
  { value: 'lost', label: 'Kaybedildi' },
  { value: 'settled', label: 'Uzlaşıldı' },
  { value: 'closed', label: 'Kapatıldı' },
]

const typeOptions = [
  { value: '', label: 'Tüm Türler' },
  { value: 'iscilik_alacagi', label: 'İşçilik Alacağı' },
  { value: 'bosanma', label: 'Boşanma' },
  { value: 'velayet', label: 'Velayet' },
  { value: 'mal_paylasimi', label: 'Mal Paylaşımı' },
  { value: 'kira', label: 'Kira' },
  { value: 'tuketici', label: 'Tüketici' },
  { value: 'icra', label: 'İcra' },
  { value: 'ceza', label: 'Ceza' },
  { value: 'idare', label: 'İdare' },
  { value: 'diger', label: 'Diğer' },
]

export default function CasesPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState('')
  const [caseType, setCaseType] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20

  const [timer, setTimer] = useState<ReturnType<typeof setTimeout>>()
  function handleSearch(value: string) {
    setSearch(value)
    if (timer) clearTimeout(timer)
    const t = setTimeout(() => {
      setDebouncedSearch(value)
      setPage(1)
    }, 300)
    setTimer(t)
  }

  const { data, isLoading, isError } = useCases({
    search: debouncedSearch || undefined,
    status: status || undefined,
    caseType: caseType || undefined,
    page,
    pageSize,
  })

  const deleteCase = useDeleteCase()

  const cases = data?.data || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Davalar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total > 0 ? `${total} dava kayıtlı` : 'Dava listesi'}
          </p>
        </div>
        <button
          onClick={() => navigate('/cases/new')}
          className="inline-flex items-center gap-2 rounded-lg bg-law-accent px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Yeni Dava
        </button>
      </div>

      {/* Arama + Filtreler */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Dava adı, müvekkil veya esas no ile ara..."
            className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-10 text-sm outline-none transition-colors focus:border-law-accent focus:ring-2 focus:ring-law-accent/20"
          />
          {search && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-law-accent"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={caseType}
          onChange={(e) => { setCaseType(e.target.value); setPage(1) }}
          className="rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-law-accent"
        >
          {typeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Yükleniyor */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Hata */}
      {isError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 p-6">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-700">Dava listesi yüklenemedi.</p>
          </CardContent>
        </Card>
      )}

      {/* Liste */}
      {!isLoading && !isError && (
        <>
          {cases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Scale className="mb-3 h-12 w-12 text-muted-foreground/30" />
              <h3 className="text-lg font-medium text-muted-foreground">
                {debouncedSearch || status || caseType ? 'Sonuç bulunamadı' : 'Henüz dava eklenmemiş'}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground/70">
                {debouncedSearch || status || caseType
                  ? 'Filtreleri değiştirerek tekrar deneyin'
                  : 'İlk davanızı açarak başlayın'}
              </p>
              {!debouncedSearch && !status && !caseType && (
                <button
                  onClick={() => navigate('/cases/new')}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-law-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  <Plus className="h-4 w-4" />
                  Yeni Dava
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3">Dava</th>
                    <th className="hidden px-4 py-3 sm:table-cell">Müvekkil</th>
                    <th className="hidden px-4 py-3 md:table-cell">Tür</th>
                    <th className="px-4 py-3">Durum</th>
                    <th className="hidden px-4 py-3 xl:table-cell">AI Workspace</th>
                    <th className="hidden px-4 py-3 lg:table-cell">Mahkeme</th>
                    <th className="hidden px-4 py-3 lg:table-cell">Tarih</th>
                    <th className="px-4 py-3 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cases.map((c: any) => (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/cases/${c.id}`)}
                      className="cursor-pointer transition-colors hover:bg-muted/50 even:bg-muted/20"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium">{c.title}</p>
                        {c.caseNumber && (
                          <p className="text-xs text-muted-foreground">Esas: {c.caseNumber}</p>
                        )}
                      </td>
                      <td className="hidden px-4 py-3 sm:table-cell">
                        <span className="text-muted-foreground">{c.clientName || '—'}</span>
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <span className="text-muted-foreground">
                          {caseTypeLabels[c.caseType] || c.caseType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant[c.status] || 'secondary'}>
                          {caseStatusLabels[c.status] || c.status}
                        </Badge>
                      </td>
                      <td className="hidden px-4 py-3 xl:table-cell">
                        <div className="space-y-1">
                          <Badge variant={c.automationStatus === 'completed' ? 'success' : 'outline'}>
                            <span className="inline-flex items-center gap-1">
                              <Bot className="h-3 w-3" />
                              {automationStatusLabels[c.automationStatus] || c.automationStatus || 'Baslanmadi'}
                            </span>
                          </Badge>
                          {c.automationCaseCode && (
                            <p className="max-w-[220px] truncate text-[11px] text-muted-foreground">
                              {c.automationCaseCode}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 lg:table-cell">
                        <span className="text-xs text-muted-foreground">{c.courtName || '—'}</span>
                      </td>
                      <td className="hidden px-4 py-3 lg:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(c.startDate || c.createdAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/cases/${c.id}`) }}
                            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                            title="Görüntüle"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/cases/${c.id}/edit`) }}
                            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                            title="Düzenle"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm('Bu davayı silmek istediğinize emin misiniz?')) {
                                deleteCase.mutate(c.id)
                              }
                            }}
                            className="rounded p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                            title="Sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-xs text-muted-foreground">
                    {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} / {total}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="rounded p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="px-2 text-xs font-medium">{page} / {totalPages}</span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="rounded p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
