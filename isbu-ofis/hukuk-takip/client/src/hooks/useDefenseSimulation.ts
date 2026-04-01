import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  GenerateDefenseSimulationInput,
  ReviewDefenseSimulationInput,
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

export function useCaseDefenseSimulation(caseId?: string) {
  return useQuery({
    queryKey: ['cases', caseId, 'defenseSimulation'],
    queryFn: () =>
      apiFetch<{ defenseSimulation: any }>(`${API}/defense-simulation/${caseId}`),
    enabled: !!caseId,
  })
}

export function useGenerateDefenseSimulation(caseId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: GenerateDefenseSimulationInput) =>
      apiFetch<{ defenseSimulation: any; hasRiskFlag?: boolean; message?: string }>(
        `${API}/defense-simulation/${caseId}/generate`,
        { method: 'POST', body: JSON.stringify(input) }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cases', caseId, 'defenseSimulation'] })
      qc.invalidateQueries({ queryKey: ['cases', caseId] })
    },
  })
}

export function useReviewDefenseSimulation(caseId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ReviewDefenseSimulationInput) =>
      apiFetch<{ message?: string }>(`${API}/defense-simulation/${caseId}/review`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cases', caseId, 'defenseSimulation'] })
      qc.invalidateQueries({ queryKey: ['cases', caseId] })
    },
  })
}
