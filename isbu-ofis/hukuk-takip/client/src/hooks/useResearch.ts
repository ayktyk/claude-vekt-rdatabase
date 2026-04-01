import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/axios'
import type {
  BatchUpdateResearchArgumentsInput,
  ReviewCaseResearchInput,
  RunCaseResearchInput,
  UpsertCaseResearchProfileInput,
} from '@hukuk-takip/shared'

export function useCaseResearchProfile(caseId: string | undefined) {
  return useQuery({
    queryKey: ['cases', caseId, 'research-profile'],
    queryFn: async () => {
      const res = await api.get(`/cases/${caseId}/research-profile`)
      return res.data
    },
    enabled: !!caseId,
  })
}

export function useUpdateCaseResearchProfile(caseId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpsertCaseResearchProfileInput) => {
      const res = await api.put(`/cases/${caseId}/research-profile`, data)
      return res.data
    },
    onSuccess: () => {
      if (caseId) {
        queryClient.invalidateQueries({ queryKey: ['cases', caseId, 'research-profile'] })
        queryClient.invalidateQueries({ queryKey: ['cases', caseId, 'ai-jobs'] })
      }
      toast.success('Araştırma profili kaydedildi.')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Araştırma profili kaydedilemedi.'
      toast.error(message)
    },
  })
}

export function useRunCaseResearch(caseId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: RunCaseResearchInput) => {
      const res = await api.post(`/cases/${caseId}/research/run`, data)
      return res.data
    },
    onSuccess: () => {
      if (caseId) {
        queryClient.invalidateQueries({ queryKey: ['cases', caseId, 'research-profile'] })
        queryClient.invalidateQueries({ queryKey: ['cases', caseId, 'ai-jobs'] })
        queryClient.invalidateQueries({ queryKey: ['cases', caseId] })
      }
      toast.success('Gerçek araştırma koşusu tamamlandı.')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Araştırma koşusu başarısız oldu.'
      toast.error(message)
    },
  })
}

export function useOrchestrateResearch(caseId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const anthropicApiKey = localStorage.getItem('anthropic_api_key') || undefined
      const res = await api.post(`/cases/${caseId}/research/orchestrate`, { anthropicApiKey })
      return res.data
    },
    onSuccess: (data) => {
      if (caseId) {
        queryClient.invalidateQueries({ queryKey: ['cases', caseId, 'research-profile'] })
        queryClient.invalidateQueries({ queryKey: ['cases', caseId, 'research-qc'] })
        queryClient.invalidateQueries({ queryKey: ['cases', caseId, 'ai-jobs'] })
        queryClient.invalidateQueries({ queryKey: ['cases', caseId] })
      }
      toast.success(`Opus 4.6 araştırma tamamlandı: ${data.decisionsFound} karar, ${data.legislationFound} mevzuat bulundu.`)
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Orkestre araştırma başarısız oldu.'
      toast.error(message)
    },
  })
}

// ─── Research QC Hooks ──────────────────────────────────────────────────────

export function useCaseResearchQc(caseId: string | undefined) {
  return useQuery({
    queryKey: ['cases', caseId, 'research-qc'],
    queryFn: async () => {
      const res = await api.get(`/cases/${caseId}/research/qc`)
      return res.data
    },
    enabled: !!caseId,
  })
}

export function useReviewCaseResearch(caseId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ReviewCaseResearchInput) => {
      const res = await api.post(`/cases/${caseId}/research/review`, data)
      return res.data
    },
    onSuccess: (_data, variables) => {
      if (caseId) {
        queryClient.invalidateQueries({ queryKey: ['cases', caseId, 'research-qc'] })
        queryClient.invalidateQueries({ queryKey: ['cases', caseId, 'research-profile'] })
        queryClient.invalidateQueries({ queryKey: ['cases', caseId, 'ai-jobs'] })
        queryClient.invalidateQueries({ queryKey: ['cases', caseId] })
      }
      toast.success(variables.approved ? 'Araştırma kalite kontrolü onaylandı.' : 'Araştırma kalite kontrolü reddedildi.')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'İşlem yapılamadı.'
      toast.error(message)
    },
  })
}

export function useUpdateResearchArguments(caseId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: BatchUpdateResearchArgumentsInput) => {
      const res = await api.put(`/cases/${caseId}/research/arguments`, data)
      return res.data
    },
    onSuccess: () => {
      if (caseId) {
        queryClient.invalidateQueries({ queryKey: ['cases', caseId, 'research-qc'] })
      }
      toast.success('Argüman seçimleri güncellendi.')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Argüman seçimleri güncellenemedi.'
      toast.error(message)
    },
  })
}
