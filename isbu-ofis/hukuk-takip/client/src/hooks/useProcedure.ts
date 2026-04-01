import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/axios'
import type {
  GenerateProcedurePrecheckInput,
  GenerateProcedureReportInput,
  ReviewProcedureReportInput,
} from '@hukuk-takip/shared'

export function useCaseProcedureReport(caseId: string | undefined) {
  return useQuery({
    queryKey: ['cases', caseId, 'procedure'],
    queryFn: async () => {
      const res = await api.get(`/procedure/${caseId}`)
      return res.data
    },
    enabled: !!caseId,
  })
}

export function useRunProcedurePrecheck(caseId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: GenerateProcedurePrecheckInput) => {
      const res = await api.post(`/procedure/${caseId}/precheck`, data)
      return res.data
    },
    onSuccess: () => {
      if (caseId) {
        queryClient.invalidateQueries({ queryKey: ['cases', caseId, 'procedure'] })
        queryClient.invalidateQueries({ queryKey: ['cases', caseId] })
      }
      toast.success('Usul on kontrolu tamamlandi.')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'On kontrol yapilamadi.'
      toast.error(message)
    },
  })
}

export function useGenerateProcedureReport(caseId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: GenerateProcedureReportInput) => {
      const res = await api.post(`/procedure/${caseId}/generate`, data)
      return res.data
    },
    onSuccess: () => {
      if (caseId) {
        queryClient.invalidateQueries({ queryKey: ['cases', caseId, 'procedure'] })
        queryClient.invalidateQueries({ queryKey: ['cases', caseId] })
      }
      toast.success('Usul raporu olusturuldu.')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Usul raporu olusturulamadi.'
      toast.error(message)
    },
  })
}

export function useReviewProcedureReport(caseId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ReviewProcedureReportInput) => {
      const res = await api.post(`/procedure/${caseId}/review`, data)
      return res.data
    },
    onSuccess: (_data, variables) => {
      if (caseId) {
        queryClient.invalidateQueries({ queryKey: ['cases', caseId, 'procedure'] })
        queryClient.invalidateQueries({ queryKey: ['cases', caseId] })
      }
      toast.success(variables.approved ? 'Usul raporu onaylandi.' : 'Usul raporu reddedildi.')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Islem yapilamadi.'
      toast.error(message)
    },
  })
}
