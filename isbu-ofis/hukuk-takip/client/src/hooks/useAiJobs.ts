import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/axios'
import type {
  CreateAiJobInput,
  ReviewAiJobInput,
  RunAiJobStepInput,
} from '@hukuk-takip/shared'

export function useCaseAiJobs(caseId: string | undefined) {
  return useQuery({
    queryKey: ['cases', caseId, 'ai-jobs'],
    queryFn: async () => {
      const res = await api.get(`/cases/${caseId}/ai-jobs`)
      return res.data
    },
    enabled: !!caseId,
  })
}

export function useAiJob(jobId: string | undefined) {
  return useQuery({
    queryKey: ['ai-jobs', jobId],
    queryFn: async () => {
      const res = await api.get(`/ai-jobs/${jobId}`)
      return res.data
    },
    enabled: !!jobId,
  })
}

export function useCreateAiJob(caseId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateAiJobInput) => {
      const res = await api.post(`/cases/${caseId}/ai-jobs`, data)
      return res.data
    },
    onSuccess: () => {
      if (caseId) {
        queryClient.invalidateQueries({ queryKey: ['cases', caseId, 'ai-jobs'] })
      }
      toast.success('AI job olusturuldu.')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'AI job olusturulamadi.'
      toast.error(message)
    },
  })
}

export function useRunAiJobStep(caseId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: { jobId: string; data: RunAiJobStepInput }) => {
      const res = await api.post(`/ai-jobs/${payload.jobId}/run-step`, payload.data)
      return res.data
    },
    onSuccess: (_data, variables) => {
      if (caseId) {
        queryClient.invalidateQueries({ queryKey: ['cases', caseId, 'ai-jobs'] })
      }
      queryClient.invalidateQueries({ queryKey: ['ai-jobs', variables.jobId] })
      toast.success('AI job adimi guncellendi.')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'AI job adimi guncellenemedi.'
      toast.error(message)
    },
  })
}

export function useReviewAiJob(caseId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: { jobId: string; data: ReviewAiJobInput }) => {
      const res = await api.post(`/ai-jobs/${payload.jobId}/review`, payload.data)
      return res.data
    },
    onSuccess: (_data, variables) => {
      if (caseId) {
        queryClient.invalidateQueries({ queryKey: ['cases', caseId, 'ai-jobs'] })
      }
      queryClient.invalidateQueries({ queryKey: ['ai-jobs', variables.jobId] })
      toast.success('AI review kaydi olusturuldu.')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'AI review kaydi olusturulamadi.'
      toast.error(message)
    },
  })
}
