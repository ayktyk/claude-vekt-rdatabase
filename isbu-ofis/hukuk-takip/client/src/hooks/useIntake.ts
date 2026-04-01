import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/axios'
import type {
  ApproveCaseBriefingInput,
  ApproveCaseIntakeProfileInput,
  GenerateCaseBriefingInput,
  GenerateCriticalPointInput,
  UpsertCaseIntakeProfileInput,
} from '@hukuk-takip/shared'

export function useCaseIntakeProfile(caseId: string | undefined) {
  return useQuery({
    queryKey: ['cases', caseId, 'intake-profile'],
    queryFn: async () => {
      const res = await api.get(`/cases/${caseId}/intake-profile`)
      return res.data
    },
    enabled: !!caseId,
  })
}

export function useUpdateCaseIntakeProfile(caseId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpsertCaseIntakeProfileInput) => {
      const res = await api.put(`/cases/${caseId}/intake-profile`, data)
      return res.data
    },
    onSuccess: () => {
      if (caseId) {
        queryClient.invalidateQueries({ queryKey: ['cases', caseId, 'intake-profile'] })
      }
      toast.success('Intake profili kaydedildi.')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Intake profili kaydedilemedi.'
      toast.error(message)
    },
  })
}

export function useGenerateCriticalPoint(caseId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: GenerateCriticalPointInput) => {
      const res = await api.post(`/cases/${caseId}/intake-profile/generate-critical-point`, data)
      return res.data
    },
    onSuccess: () => {
      if (caseId) {
        queryClient.invalidateQueries({ queryKey: ['cases', caseId, 'intake-profile'] })
        queryClient.invalidateQueries({ queryKey: ['cases', caseId, 'research-profile'] })
        queryClient.invalidateQueries({ queryKey: ['cases', caseId, 'ai-jobs'] })
      }
      toast.success('Kritik nokta taslağı oluşturuldu.')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Kritik nokta oluşturulamadı.'
      toast.error(message)
    },
  })
}

export function useApproveCaseIntakeProfile(caseId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ApproveCaseIntakeProfileInput) => {
      const res = await api.post(`/cases/${caseId}/intake-profile/approve`, data)
      return res.data
    },
    onSuccess: () => {
      if (caseId) {
        queryClient.invalidateQueries({ queryKey: ['cases', caseId, 'intake-profile'] })
      }
      toast.success('Kritik nokta onay durumu güncellendi.')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Kritik nokta onayı güncellenemedi.'
      toast.error(message)
    },
  })
}

export function useCaseBriefing(caseId: string | undefined) {
  return useQuery({
    queryKey: ['cases', caseId, 'briefing'],
    queryFn: async () => {
      const res = await api.get(`/cases/${caseId}/briefing`)
      return res.data
    },
    enabled: !!caseId,
  })
}

export function useGenerateCaseBriefing(caseId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: GenerateCaseBriefingInput) => {
      const res = await api.post(`/cases/${caseId}/briefing/generate`, data)
      return res.data
    },
    onSuccess: () => {
      if (caseId) {
        queryClient.invalidateQueries({ queryKey: ['cases', caseId, 'briefing'] })
        queryClient.invalidateQueries({ queryKey: ['cases', caseId] })
        queryClient.invalidateQueries({ queryKey: ['cases', caseId, 'ai-jobs'] })
      }
      toast.success('Briefing taslağı oluşturuldu.')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Briefing oluşturulamadı.'
      toast.error(message)
    },
  })
}

export function useApproveCaseBriefing(caseId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ApproveCaseBriefingInput) => {
      const res = await api.post(`/cases/${caseId}/briefing/approve`, data)
      return res.data
    },
    onSuccess: () => {
      if (caseId) {
        queryClient.invalidateQueries({ queryKey: ['cases', caseId, 'briefing'] })
      }
      toast.success('Briefing onay durumu güncellendi.')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Briefing onayı güncellenemedi.'
      toast.error(message)
    },
  })
}
