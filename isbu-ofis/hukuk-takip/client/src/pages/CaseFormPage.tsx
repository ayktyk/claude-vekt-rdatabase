import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  createCaseSchema,
  caseTypeValues,
  caseStatusValues,
  automationStatusValues,
  type CreateCaseInput,
} from '@hukuk-takip/shared'
import { useCase, useCreateCase, useUpdateCase } from '@/hooks/useCases'
import { useClients, useCreateClient } from '@/hooks/useClients'
import { caseTypeLabels, caseStatusLabels, automationStatusLabels } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ArrowLeft, Save, Loader2, Scale, Bot, Sparkles, Plus } from 'lucide-react'

export default function CaseFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const { data: caseData, isLoading: loadingCase } = useCase(id)
  const createCase = useCreateCase()
  const updateCase = useUpdateCase(id || '')
  const { data: clientsData } = useClients({ pageSize: 100 })

  const [aiEnabled, setAiEnabled] = useState(false)
  const [clientDialogOpen, setClientDialogOpen] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')
  const [newClientEmail, setNewClientEmail] = useState('')
  const createClient = useCreateClient()
  const clients = clientsData?.data || []

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateCaseInput>({
    resolver: zodResolver(createCaseSchema),
    defaultValues: {
      clientId: '',
      caseNumber: '',
      courtName: '',
      caseType: 'diger',
      customCaseType: '',
      title: '',
      description: '',
      startDate: '',
      automationCaseCode: '',
      automationStatus: 'not_started',
      driveFolderPath: '',
      briefingPath: '',
      procedurePath: '',
      researchPath: '',
      defenseSimulationPath: '',
      revisionPath: '',
      pleadingMdPath: '',
      pleadingUdfPath: '',
      contractedFee: '',
      currency: 'TRY',
      status: 'active',
    } as any,
  })

  useEffect(() => {
    if (isEdit && caseData) {
      reset({
        clientId: caseData.clientId || '',
        caseNumber: caseData.caseNumber || '',
        courtName: caseData.courtName || '',
        caseType: caseData.caseType || 'diger',
        customCaseType: caseData.customCaseType || '',
        title: caseData.title || '',
        description: caseData.description || '',
        startDate: caseData.startDate ? new Date(caseData.startDate).toISOString().split('T')[0] : '',
        automationCaseCode: caseData.automationCaseCode || '',
        automationStatus: caseData.automationStatus || 'not_started',
        driveFolderPath: caseData.driveFolderPath || '',
        briefingPath: caseData.briefingPath || '',
        procedurePath: caseData.procedurePath || '',
        researchPath: caseData.researchPath || '',
        defenseSimulationPath: caseData.defenseSimulationPath || '',
        revisionPath: caseData.revisionPath || '',
        pleadingMdPath: caseData.pleadingMdPath || '',
        pleadingUdfPath: caseData.pleadingUdfPath || '',
        contractedFee: caseData.contractedFee || '',
        currency: caseData.currency || 'TRY',
        status: caseData.status || 'active',
      } as any)
    }
  }, [caseData, isEdit, reset])

  const selectedCaseType = watch('caseType')

  function handleCreateClient() {
    if (!newClientName.trim()) return
    createClient.mutate(
      {
        fullName: newClientName.trim(),
        phone: newClientPhone.trim() || undefined,
        email: newClientEmail.trim() || undefined,
      },
      {
        onSuccess: (res: any) => {
          const newId = res?.data?.id
          if (newId) {
            setValue('clientId', newId)
          }
          setClientDialogOpen(false)
          setNewClientName('')
          setNewClientPhone('')
          setNewClientEmail('')
        },
      }
    )
  }

  function onSubmit(data: CreateCaseInput) {
    const payload = aiEnabled && !isEdit
      ? { ...data, automationStatus: 'folder_ready' as const }
      : data
    if (isEdit) {
      updateCase.mutate(payload, {
        onSuccess: () => navigate(`/cases/${id}`),
      })
    } else {
      createCase.mutate(payload, {
        onSuccess: (res: any) => {
          const newCaseId = res?.data?.id
          if (aiEnabled && newCaseId) {
            navigate(`/cases/${newCaseId}`)
          } else {
            navigate('/cases')
          }
        },
      })
    }
  }

  if (isEdit && loadingCase) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="space-y-4 p-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  const isPending = createCase.isPending || updateCase.isPending

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Başlık */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="page-title">
            {isEdit ? 'Dava Düzenle' : 'Yeni Dava'}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isEdit ? 'Dava bilgilerini güncelleyin' : 'Yeni dava kaydı oluşturun'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Scale className="h-4 w-4 text-law-accent" />
              Dava Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Dava Başlığı */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Dava Başlığı <span className="text-red-500">*</span>
              </label>
              <input
                {...register('title')}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-law-accent focus:ring-2 focus:ring-law-accent/20"
                placeholder="Ahmet Yılmaz - İşçilik Alacağı Davası"
              />
              {errors.title && (
                <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Müvekkil + Dava Türü */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Müvekkil <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    {...register('clientId')}
                    className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-law-accent"
                  >
                    <option value="">Müvekkil seçin</option>
                    {clients.map((client: any) => (
                      <option key={client.id} value={client.id}>
                        {client.fullName}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setClientDialogOpen(true)}
                    className="flex-shrink-0 rounded-lg border bg-background px-2.5 py-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    title="Yeni müvekkil ekle"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {errors.clientId && (
                  <p className="mt-1 text-xs text-red-600">{errors.clientId.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Dava Türü <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('caseType')}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-law-accent"
                >
                  {caseTypeValues.map((type) => (
                    <option key={type} value={type}>
                      {caseTypeLabels[type] || type}
                    </option>
                  ))}
                </select>
                {errors.caseType && (
                  <p className="mt-1 text-xs text-red-600">{errors.caseType.message}</p>
                )}
              </div>
            </div>

            {/* Özel Dava Türü — sadece "diger" seçildiğinde */}
            {selectedCaseType === 'diger' && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Özel Dava Türü
                </label>
                <input
                  {...register('customCaseType')}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-law-accent focus:ring-2 focus:ring-law-accent/20"
                  placeholder="Örn: Ortaklığın giderilmesi, Tapu iptali..."
                />
              </div>
            )}

            {/* Esas No + Mahkeme */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Esas Numarası</label>
                <input
                  {...register('caseNumber')}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-law-accent focus:ring-2 focus:ring-law-accent/20"
                  placeholder="2025/1234"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Mahkeme</label>
                <input
                  {...register('courtName')}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-law-accent focus:ring-2 focus:ring-law-accent/20"
                  placeholder="İstanbul 5. İş Mahkemesi"
                />
              </div>
            </div>

            {/* Dava Durumu (sadece düzenleme modunda) */}
            {isEdit && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">Dava Durumu</label>
                <select
                  {...register('status' as any)}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-law-accent"
                >
                  {caseStatusValues.map((s) => (
                    <option key={s} value={s}>
                      {caseStatusLabels[s] || s}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Başlangıç Tarihi + Ücret */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Başlangıç Tarihi</label>
                <input
                  {...register('startDate')}
                  type="date"
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-law-accent focus:ring-2 focus:ring-law-accent/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Anlaşılan Ücret (₺)</label>
                <input
                  {...register('contractedFee')}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-law-accent focus:ring-2 focus:ring-law-accent/20"
                  placeholder="25000.00"
                />
                {errors.contractedFee && (
                  <p className="mt-1 text-xs text-red-600">{errors.contractedFee.message}</p>
                )}
              </div>
            </div>

            {/* Açıklama */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Açıklama</label>
              <textarea
                {...register('description')}
                rows={4}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-law-accent focus:ring-2 focus:ring-law-accent/20 resize-none"
                placeholder="Dava hakkında detaylı açıklama..."
              />
            </div>
          </CardContent>
        </Card>

        {/* AI ile Başlat — sadece yeni dava */}
        {!isEdit && (
          <Card className={`relative overflow-hidden transition-all ${aiEnabled ? 'border-law-accent/40 bg-law-accent/5' : ''}`}>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <button
                  type="button"
                  onClick={() => setAiEnabled(!aiEnabled)}
                  className={`relative mt-0.5 flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                    aiEnabled ? 'bg-law-accent' : 'bg-muted-foreground/30'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                      aiEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className={`h-4 w-4 ${aiEnabled ? 'text-law-accent' : 'text-muted-foreground'}`} />
                    <span className="text-sm font-medium">AI ile Başlat</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Davayı kaydettikten sonra AI Çalışma Alanı otomatik olarak aktifleşir.
                    Briefing, usul raporu ve araştırma adımları sırayla başlatılabilir.
                  </p>
                  {aiEnabled && (
                    <div className="mt-3 flex items-center gap-2 rounded-md border border-law-accent/20 bg-law-accent/10 px-3 py-2 text-xs text-law-accent">
                      <Bot className="h-3.5 w-3.5" />
                      Dava kaydedildikten sonra AI Çalışma Alanı sekmesine yönlendirileceksiniz.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Otomasyon Workspace</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Otomasyon Dava Kodu</label>
                <input
                  {...register('automationCaseCode')}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-law-accent focus:ring-2 focus:ring-law-accent/20"
                  placeholder="2026-003-Sezen-iscilik"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Otomasyon Durumu</label>
                <select
                  {...register('automationStatus')}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-law-accent"
                >
                  {automationStatusValues.map((status) => (
                    <option key={status} value={status}>
                      {automationStatusLabels[status] || status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Drive Klasör Yolu</label>
              <input
                {...register('driveFolderPath')}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-law-accent focus:ring-2 focus:ring-law-accent/20"
                placeholder="G:\\Drive'im\\Hukuk Burosu\\Aktif Davalar\\2026-003-Sezen-iscilik"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Briefing Dosya Yolu</label>
              <input
                {...register('briefingPath')}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-law-accent focus:ring-2 focus:ring-law-accent/20"
                placeholder="...\\00-Briefing.md"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Araştırma Dosya Yolu</label>
              <input
                {...register('researchPath')}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-law-accent focus:ring-2 focus:ring-law-accent/20"
                placeholder="...\\02-Araştırma\\arastirma-raporu.md"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Usul Raporu Yolu</label>
              <input
                {...register('procedurePath')}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-law-accent focus:ring-2 focus:ring-law-accent/20"
                placeholder="...\\01-Usul\\usul-raporu.md"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Savunma Simülasyonu Yolu</label>
              <input
                {...register('defenseSimulationPath')}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-law-accent focus:ring-2 focus:ring-law-accent/20"
                placeholder="...\\02-Araştırma\\savunma-simulasyonu.md"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Revizyon Raporu Yolu</label>
              <input
                {...register('revisionPath')}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-law-accent focus:ring-2 focus:ring-law-accent/20"
                placeholder="...\\03-Sentez-ve-Dilekçe\\revizyon-raporu-v1.md"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Dilekçe Markdown Yolu</label>
                <input
                  {...register('pleadingMdPath')}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-law-accent focus:ring-2 focus:ring-law-accent/20"
                  placeholder="...\\dava-dilekcesi-v1.md"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Dilekçe UDF Yolu</label>
                <input
                  {...register('pleadingUdfPath')}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-law-accent focus:ring-2 focus:ring-law-accent/20"
                  placeholder="...\\dava-dilekcesi-v1.udf"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Butonlar */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-law-accent px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isEdit ? 'Güncelle' : 'Kaydet'}
          </button>
        </div>
      </form>

      {/* Yeni Müvekkil Dialog */}
      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Müvekkil Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Ad Soyad <span className="text-red-500">*</span>
              </label>
              <input
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-law-accent focus:ring-2 focus:ring-law-accent/20"
                placeholder="Ahmet Yılmaz"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Telefon</label>
              <input
                value={newClientPhone}
                onChange={(e) => setNewClientPhone(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-law-accent focus:ring-2 focus:ring-law-accent/20"
                placeholder="05XX XXX XX XX"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">E-posta</label>
              <input
                value={newClientEmail}
                onChange={(e) => setNewClientEmail(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-law-accent focus:ring-2 focus:ring-law-accent/20"
                placeholder="ornek@email.com"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setClientDialogOpen(false)}
                className="rounded-lg border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleCreateClient}
                disabled={!newClientName.trim() || createClient.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-law-accent px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:opacity-90 disabled:opacity-50"
              >
                {createClient.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Oluştur
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
