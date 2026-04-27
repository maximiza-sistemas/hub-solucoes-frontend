import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { alunosApi } from '@/services/api'
import { useAuthStore } from '@/stores/auth-store'
import type { ImportJobProgress } from '@/types'

const POLL_INTERVAL_MS = 1500

interface ImportJobState {
    jobId: string | null
    fileName: string | null
    progress: ImportJobProgress | null
    polling: boolean
    cancelling: boolean
    lastCompletedAt: number | null
    start: (jobId: string, fileName: string) => void
    cancel: () => Promise<void>
    dismiss: () => void
    resumeIfActive: () => Promise<void>
    _stopPolling: () => void
    _startPolling: () => void
}

let pollTimer: ReturnType<typeof setInterval> | null = null

export const useImportJobStore = create<ImportJobState>()(
    persist(
        (set, get) => ({
            jobId: null,
            fileName: null,
            progress: null,
            polling: false,
            cancelling: false,
            lastCompletedAt: null,

            start: (jobId, fileName) => {
                set({
                    jobId,
                    fileName,
                    progress: null,
                    cancelling: false,
                })
                get()._startPolling()
            },

            cancel: async () => {
                const { jobId } = get()
                if (!jobId) return
                set({ cancelling: true })
                try {
                    const token = useAuthStore.getState().accessToken
                    const updated = await alunosApi.cancelImport(jobId, token)
                    set({ progress: updated })
                } catch {
                    set({ cancelling: false })
                }
            },

            dismiss: () => {
                get()._stopPolling()
                set({
                    jobId: null,
                    fileName: null,
                    progress: null,
                    cancelling: false,
                })
            },

            resumeIfActive: async () => {
                const { jobId } = get()
                if (!jobId) {
                    // Tenta descobrir job ativo no servidor (caso de F5 sem state local válido).
                    try {
                        const token = useAuthStore.getState().accessToken
                        if (!token) return
                        const active = await alunosApi.getActiveImport(token)
                        if (active && active.id) {
                            set({
                                jobId: active.id,
                                fileName: active.fileName,
                                progress: active,
                            })
                            get()._startPolling()
                        }
                    } catch {
                        // ignora
                    }
                    return
                }
                // Tem jobId no localStorage — verifica estado atual.
                try {
                    const token = useAuthStore.getState().accessToken
                    const current = await alunosApi.getImportProgress(jobId, token)
                    set({
                        progress: current,
                        fileName: current.fileName,
                    })
                    if (!isFinalStatus(current.status)) {
                        get()._startPolling()
                    } else {
                        // Job já terminou; mantém o painel para o usuário fechar.
                        set({ polling: false })
                    }
                } catch {
                    // Job não existe mais — limpa.
                    set({
                        jobId: null,
                        fileName: null,
                        progress: null,
                    })
                }
            },

            _stopPolling: () => {
                if (pollTimer) {
                    clearInterval(pollTimer)
                    pollTimer = null
                }
                set({ polling: false })
            },

            _startPolling: () => {
                get()._stopPolling()
                set({ polling: true })
                const tick = async () => {
                    const { jobId } = get()
                    if (!jobId) {
                        get()._stopPolling()
                        return
                    }
                    try {
                        const token = useAuthStore.getState().accessToken
                        const next = await alunosApi.getImportProgress(jobId, token)
                        set({ progress: next })
                        if (isFinalStatus(next.status)) {
                            get()._stopPolling()
                            if (next.status === 'COMPLETED' || next.status === 'CANCELLED') {
                                set({ lastCompletedAt: Date.now() })
                            }
                        }
                    } catch {
                        // mantém polling — pode ser blip de rede
                    }
                }
                tick()
                pollTimer = setInterval(tick, POLL_INTERVAL_MS)
            },
        }),
        {
            name: 'hub-import-job',
            partialize: (state) => ({
                jobId: state.jobId,
                fileName: state.fileName,
            }),
        }
    )
)

function isFinalStatus(s: ImportJobProgress['status']): boolean {
    return s === 'COMPLETED' || s === 'FAILED' || s === 'CANCELLED'
}
