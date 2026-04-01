import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  GeneratePleadingInput,
  ReviewPleadingInput,
  UpdatePleadingDraftInput,
} from '@hukuk-takip/shared'

const API = '/api'

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export function useCasePleading(caseId?: string) {
  return useQuery({
    queryKey: ['cases', caseId, 'pleading'],
    queryFn: () => apiFetch<{ pleading: any }>(`${API}/pleading/${caseId}`),
    enabled: !!caseId,
  })
}

export function useGeneratePleading(caseId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: GeneratePleadingInput) =>
      apiFetch<{ pleading: any; message?: string }>(`${API}/pleading/${caseId}/generate`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cases', caseId, 'pleading'] })
      qc.invalidateQueries({ queryKey: ['cases', caseId] })
    },
  })
}

export function useUpdatePleadingDraft(caseId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdatePleadingDraftInput) =>
      apiFetch<{ artifact: any; message?: string }>(`${API}/pleading/${caseId}/draft`, {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cases', caseId, 'pleading'] })
    },
  })
}

export function useReviewPleading(caseId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ReviewPleadingInput) =>
      apiFetch<{ message?: string }>(`${API}/pleading/${caseId}/review`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cases', caseId, 'pleading'] })
      qc.invalidateQueries({ queryKey: ['cases', caseId] })
    },
  })
}

export function useRevisePleading(caseId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: GeneratePleadingInput) =>
      apiFetch<{ revisionReport: string; pleadingV2: any; message?: string }>(
        `${API}/pleading/${caseId}/revise`,
        { method: 'POST', body: JSON.stringify(input) }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cases', caseId, 'pleading'] })
      qc.invalidateQueries({ queryKey: ['cases', caseId] })
    },
  })
}

export function useExportPleadingUdf(caseId?: string) {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API}/pleading/${caseId}/export-udf`, {
        credentials: 'include',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error || `HTTP ${res.status}`)
      }
      const blob = await res.blob()
      const disposition = res.headers.get('Content-Disposition') || ''
      const filenameMatch = disposition.match(/filename="?([^"]+)"?/u)
      const filename = filenameMatch?.[1] || 'dilekce.udf'

      // Trigger download
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      return { filename }
    },
  })
}

export function useFinalReviewPleading(caseId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ReviewPleadingInput) =>
      apiFetch<{ message?: string }>(`${API}/pleading/${caseId}/final-review`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cases', caseId, 'pleading'] })
      qc.invalidateQueries({ queryKey: ['cases', caseId] })
    },
  })
}
