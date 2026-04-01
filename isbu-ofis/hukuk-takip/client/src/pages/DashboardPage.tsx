import { useNavigate } from 'react-router-dom'
import { useDashboard } from '@/hooks/useDashboard'
import {
  formatDate,
  formatCurrency,
  formatRelativeDate,
  isOverdue,
  taskPriorityLabels,
  automationStatusLabels,
  caseStatusLabels,
  caseTypeLabels,
} from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Scale,
  TrendingUp,
  TrendingDown,
  ListChecks,
  CalendarClock,
  ChevronRight,
  AlertTriangle,
  Clock,
  Bot,
  Users,
  Banknote,
} from 'lucide-react'

const priorityVariant: Record<string, 'danger' | 'warning' | 'secondary' | 'outline'> = {
  urgent: 'danger',
  high: 'warning',
  medium: 'secondary',
  low: 'outline',
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconBg,
  iconColor,
  borderColor,
  trend,
}: {
  title: string
  value: string | number
  description: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
  borderColor?: string
  trend?: 'up' | 'down' | 'neutral'
}) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null
  return (
    <Card className={`relative overflow-hidden card-hover ${borderColor ? `border-l-2 ${borderColor}` : ''}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-[13px] font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight font-serif text-law-primary">{value}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              {TrendIcon && (
                <TrendIcon className={`h-3 w-3 ${trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`} />
              )}
              {description}
            </p>
          </div>
          <div className={`rounded-lg p-2.5 ${iconBg}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-law-gold/50 via-law-gold/15 to-transparent" />
    </Card>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-10 w-10 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data, isLoading, isError } = useDashboard()
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div>
        <h1 className="mb-6 page-title">Gösterge Paneli</h1>
        <DashboardSkeleton />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div>
        <h1 className="mb-6 page-title">Gösterge Paneli</h1>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 p-6">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-700">
              Veriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const {
    cases,
    upcomingHearings,
    pendingTasks,
    recentCases,
    financials,
    outstandingFees,
  } = data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Gösterge Paneli</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Büronuzun güncel durumuna genel bakış
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Aktif Davalar"
          value={cases?.active ?? 0}
          description={`Toplam ${cases?.total ?? 0} dava · ${cases?.won ?? 0} kazanildi`}
          icon={Scale}
          iconBg="bg-law-accent/10"
          iconColor="text-law-accent"
          borderColor="border-l-law-accent"
          trend="neutral"
        />
        <StatCard
          title="Toplam Tahsilat"
          value={formatCurrency(financials?.totalCollections)}
          description="Tüm davalardan toplam"
          icon={TrendingUp}
          iconBg="bg-emerald-500/10"
          iconColor="text-emerald-600"
          borderColor="border-l-emerald-500"
          trend="up"
        />
        <StatCard
          title="Bekleyen Görevler"
          value={pendingTasks?.length ?? 0}
          description="Tamamlanmayı bekliyor"
          icon={ListChecks}
          iconBg="bg-amber-500/10"
          iconColor="text-amber-600"
          borderColor="border-l-amber-500"
          trend="neutral"
        />
        <StatCard
          title="Yaklaşan Duruşmalar"
          value={upcomingHearings?.length ?? 0}
          description="Önümüzdeki 7 gün"
          icon={CalendarClock}
          iconBg="bg-purple-500/10"
          iconColor="text-purple-600"
          borderColor="border-l-purple-500"
          trend="neutral"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => navigate('/cases/new')}
          className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted/50"
        >
          <Scale className="h-4 w-4 text-law-accent" />
          Yeni Dava
        </button>
        <button
          onClick={() => navigate('/clients/new')}
          className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted/50"
        >
          <Users className="h-4 w-4 text-law-accent" />
          Yeni Müvekkil
        </button>
        <button
          onClick={() => navigate('/tasks')}
          className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted/50"
        >
          <ListChecks className="h-4 w-4 text-law-accent" />
          Görev Ekle
        </button>
        <button
          onClick={() => navigate('/hearings')}
          className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted/50"
        >
          <CalendarClock className="h-4 w-4 text-law-accent" />
          Duruşma Takvimi
        </button>
      </div>

      {/* AI Otomasyon Durum Paneli */}
      {data.ai && data.ai.totalActive > 0 && (
        <Card className="relative overflow-hidden border-l-2 border-l-law-accent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base text-law-primary">
                <Bot className="h-4 w-4 text-law-accent" />
                AI Otomasyon Durumu
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                {data.ai.totalActive} dava
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex flex-wrap gap-3 mb-3">
              {Object.entries(data.ai.statusBreakdown || {}).map(([status, count]) => (
                <div
                  key={status}
                  className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-foreground">
                    {automationStatusLabels[status] || status}
                  </span>
                  <span className="rounded-full bg-law-accent/10 px-2 py-0.5 text-xs font-bold text-law-accent">
                    {count as number}
                  </span>
                </div>
              ))}
            </div>
            {data.ai.activeJobs && data.ai.activeJobs.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Devam Eden AI İşleri
                </p>
                {data.ai.activeJobs.map((job: any) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between rounded-md border bg-card px-3 py-2 text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(`/cases/${job.caseId}`)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${
                        job.status === 'in_progress' ? 'bg-blue-500 animate-pulse' :
                        job.status === 'review_required' ? 'bg-amber-500' : 'bg-muted-foreground'
                      }`} />
                      <span className="font-medium">{job.caseTitle}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">{job.title}</span>
                    </div>
                    <Badge variant={job.status === 'review_required' ? 'warning' : 'secondary'} className="text-xs">
                      {job.status === 'in_progress' ? 'Devam Ediyor' :
                       job.status === 'review_required' ? 'İnceleme Bekliyor' :
                       job.status === 'queued' ? 'Sırada' : job.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-law-accent/50 via-law-accent/15 to-transparent" />
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base text-law-primary">
                <CalendarClock className="h-4 w-4 text-law-accent" />
                Yaklaşan Duruşmalar
              </CardTitle>
              <button
                onClick={() => navigate('/hearings')}
                className="flex items-center gap-1 text-xs font-medium text-law-accent transition-colors hover:text-law-primary"
              >
                Tümünü gör
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {!upcomingHearings?.length ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/20">
                  <CalendarClock className="h-7 w-7 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Yaklaşan duruşma bulunmuyor
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      <th className="pb-2 pr-4">Tarih</th>
                      <th className="pb-2 pr-4">Müvekkil</th>
                      <th className="hidden pb-2 pr-4 md:table-cell">Mahkeme</th>
                      <th className="pb-2">Salon</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {upcomingHearings.slice(0, 5).map((hearing: any) => {
                      const overdue = isOverdue(hearing.hearingDate)
                      return (
                        <tr
                          key={hearing.id}
                          onClick={() => navigate(`/cases/${hearing.caseId || ''}`)}
                          className="cursor-pointer transition-colors hover:bg-muted/50"
                        >
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              {overdue && (
                                <span className="h-2 w-2 rounded-full bg-red-500" title="Geçmiş" />
                              )}
                              <div>
                                <p className={`font-medium ${overdue ? 'text-red-600' : ''}`}>
                                  {formatDate(hearing.hearingDate)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatRelativeDate(hearing.hearingDate)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            <p className="font-medium">{hearing.clientName}</p>
                            <p className="max-w-[200px] truncate text-xs text-muted-foreground">
                              {hearing.caseTitle}
                            </p>
                          </td>
                          <td className="hidden py-3 pr-4 md:table-cell">
                            <p className="text-muted-foreground">{hearing.courtName || '-'}</p>
                          </td>
                          <td className="py-3">
                            <Badge variant="outline">{hearing.courtRoom || '-'}</Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base text-law-primary">
                <ListChecks className="h-4 w-4 text-law-accent" />
                Bekleyen Görevler
              </CardTitle>
              <button
                onClick={() => navigate('/tasks')}
                className="flex items-center gap-1 text-xs font-medium text-law-accent transition-colors hover:text-law-primary"
              >
                Tümünü gör
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {!pendingTasks?.length ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/20">
                  <ListChecks className="h-7 w-7 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Bekleyen görev bulunmuyor
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {pendingTasks.slice(0, 5).map((task: any) => {
                  const overdue = task.dueDate && isOverdue(task.dueDate)
                  return (
                    <div
                      key={task.id}
                      onClick={() => navigate('/tasks')}
                      className="group flex cursor-pointer items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            task.priority === 'urgent'
                              ? 'bg-red-500'
                              : task.priority === 'high'
                                ? 'bg-amber-500'
                                : task.priority === 'medium'
                                  ? 'bg-blue-400'
                                  : 'bg-gray-300'
                          }`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium">{task.title}</p>
                          <Badge
                            variant={priorityVariant[task.priority] || 'outline'}
                            className="flex-shrink-0 px-1.5 py-0 text-[10px]"
                          >
                            {taskPriorityLabels[task.priority] || task.priority}
                          </Badge>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {task.caseTitle}
                        </p>
                        {task.dueDate && (
                          <div className="mt-1 flex items-center gap-1">
                            <Clock className={`h-3 w-3 ${overdue ? 'text-red-500' : 'text-muted-foreground'}`} />
                            <span
                              className={`text-xs ${overdue ? 'font-medium text-red-600' : 'text-muted-foreground'}`}
                            >
                              {formatRelativeDate(task.dueDate)}
                            </span>
                          </div>
                        )}
                      </div>
                      <ChevronRight className="mt-1 h-4 w-4 flex-shrink-0 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {recentCases?.length > 0 && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          <Card className="xl:col-span-3">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base text-law-primary">
                  <Scale className="h-4 w-4 text-law-accent" />
                  Son Eklenen Davalar
                </CardTitle>
                <button
                  onClick={() => navigate('/cases')}
                  className="flex items-center gap-1 text-xs font-medium text-law-accent transition-colors hover:text-law-primary"
                >
                  Tümünü gör
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      <th className="pb-2 pr-4">Dava</th>
                      <th className="hidden pb-2 pr-4 sm:table-cell">Müvekkil</th>
                      <th className="hidden pb-2 pr-4 md:table-cell">Tür</th>
                      <th className="pb-2 pr-4">Durum</th>
                      <th className="hidden pb-2 pr-4 xl:table-cell">AI</th>
                      <th className="hidden pb-2 lg:table-cell">Tarih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {recentCases.slice(0, 5).map((c: any) => (
                      <tr
                        key={c.id}
                        onClick={() => navigate(`/cases/${c.id}`)}
                        className="cursor-pointer transition-colors hover:bg-muted/50"
                      >
                        <td className="py-3 pr-4">
                          <p className="font-medium">{c.title}</p>
                        </td>
                        <td className="hidden py-3 pr-4 sm:table-cell">
                          <p className="text-muted-foreground">{c.clientName}</p>
                        </td>
                        <td className="hidden py-3 pr-4 md:table-cell">
                          <p className="text-muted-foreground">
                            {caseTypeLabels[c.caseType] || c.caseType}
                          </p>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge
                            variant={
                              c.status === 'won'
                                ? 'success'
                                : c.status === 'lost'
                                  ? 'danger'
                                  : c.status === 'active'
                                    ? 'default'
                                    : 'secondary'
                            }
                          >
                            {caseStatusLabels[c.status] || c.status}
                          </Badge>
                        </td>
                        <td className="hidden py-3 pr-4 xl:table-cell">
                          <Badge variant={c.automationStatus === 'completed' ? 'success' : 'outline'}>
                            <span className="inline-flex items-center gap-1">
                              <Bot className="h-3 w-3" />
                              {automationStatusLabels[c.automationStatus] || c.automationStatus || 'Başlanmadı'}
                            </span>
                          </Badge>
                        </td>
                        <td className="hidden py-3 lg:table-cell">
                          <p className="text-xs text-muted-foreground">
                            {formatDate(c.createdAt)}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="xl:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-law-primary">
                <Banknote className="h-4 w-4 text-law-accent" />
                Beklenen Tahsilatlar
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!outstandingFees?.length ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Banknote className="mb-2 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    Beklenen tahsilat bulunmuyor
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {outstandingFees.slice(0, 5).map((fee: any) => (
                    <button
                      key={fee.id}
                      type="button"
                      onClick={() => navigate(`/cases/${fee.id}`)}
                      className="flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
                    >
                      <div className="rounded-lg bg-amber-500/10 p-2">
                        <Banknote className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{fee.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {fee.clientName || 'Müvekkil belirtilmemiş'}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-[11px]">
                          <span className="text-muted-foreground">
                            Anlaşılan: {formatCurrency(fee.contractedFee)}
                          </span>
                          <span className="text-muted-foreground">·</span>
                          <span className="font-medium text-amber-600">
                            Kalan: {formatCurrency(fee.remaining)}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
