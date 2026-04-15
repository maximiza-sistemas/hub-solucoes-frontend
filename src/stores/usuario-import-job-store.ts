import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { usuariosApi } from '@/services/api'
import { useAuthStore } from '@/stores/auth-store'
import type { ImportJobProgress } from '@/types'

const POLL_INTERVAL_MS = 1500

interface UsuarioImportJobState {
    jobId: string | null
    fileName: string | null
    progress: ImportJobProgress | null
    polling: boolean
    cancelling: boolean
    lastCompletedAt: number | null
    start: (jobId: string, fileName: string) => void
    cancel: () => Promise<void>
    dismiss: () => void
    resumeIfActive: (municipioId?: number | null) => Promise<void>
    _stopPolling: () => void
    _startPolling: () => void
}

let pollTimer: ReturnType<typeof setInterval> | null = null

export const useUsuarioImportJobStore = create<UsuarioImportJobState>()(
    persist(
        (set, get) => ({
            jobId: null,
            fileName: null,
            progress: null,
            polling: false,
            cancelling: false,
            lastCompletedAt: null,

            start: (jobId, fileName) => {
                set({ jobId, fileName, progress: null, cancelling: false })
                get()._startPolling()
            },

            cancel: async () => {
                const { jobId } = get()
                if (!jobId) return
                set({ cancelling: true })
                try {
                    const token = useAuthStore.getState().accessToken
                    const updated = await usuariosApi.cancelImport(jobId, token)
                    set({ progress: updated })
                } catch {
                    set({ cancelling: false })
                }
            },

            dismiss: () => {
                get()._stopPolling()
                set({ jobId: null, fileName: null, progress: null, cancelling: false })
            },

            resumeIfActive: async (municipioId) => {
                const { jobId } = get()
                if (!jobId) {
                    try {
                        const token = useAuthStore.getState().accessToken
                        if (!token) return
                        const active = await usuariosApi.getActiveImport(token, municipioId ?? undefined)
                        if (active && active.id) {
                            set({ jobId: active.id, fileName: active.fileName, progress: active })
                            get()._startPolling()
                        }
                    } catch {
                        // ignore
                    }
                    return
                }
                try {
                    const token = useAuthStore.getState().accessToken
                    const current = await usuariosApi.getImportProgress(jobId, token)
                    set({ progress: current, fileName: current.fileName })
                    if (!isFinalStatus(current.status)) {
                        get()._startPolling()
                    } else {
                        set({ polling: false })
                    }
                } catch {
                    set({ jobId: null, fileName: null, progress: null })
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
                        const next = await usuariosApi.getImportProgress(jobId, token)
                        set({ progress: next })
                        if (isFinalStatus(next.status)) {
                            get()._stopPolling()
                            if (next.status === 'COMPLETED' || next.status === 'CANCELLED') {
                                set({ lastCompletedAt: Date.now() })
                            }
                        }
                    } catch {
                        // network blip — keep polling
                    }
                }
                tick()
                pollTimer = setInterval(tick, POLL_INTERVAL_MS)
            },
        }),
        {
            name: 'hub-import-job-usuario',
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
