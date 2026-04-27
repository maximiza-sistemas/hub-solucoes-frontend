import { useState, useRef, useEffect } from 'react'
import { usuariosApi, municipiosApi } from '@/services/api'
import { useAuthStore } from '@/stores/auth-store'
import { useUsuarioImportJobStore } from '@/stores/usuario-import-job-store'
import type { Municipio } from '@/types'

const TEMPLATE_URL = '/templates/import-usuario-template.xlsx'

interface UsuarioImportModalProps {
    isOpen: boolean
    onClose: () => void
}

export function UsuarioImportModal({ isOpen, onClose }: UsuarioImportModalProps) {
    const user = useAuthStore(s => s.user)
    const isSuperAdmin = user?.role === 'SUPERADMIN'

    const [file, setFile] = useState<File | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [municipioId, setMunicipioId] = useState<number | ''>('')
    const [municipios, setMunicipios] = useState<Municipio[]>([])
    const [loadingMunicipios, setLoadingMunicipios] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const lastImportedFileRef = useRef<string | null>(null)

    useEffect(() => {
        if (!isOpen || !isSuperAdmin) return
        let cancelled = false
        setLoadingMunicipios(true)
        const token = useAuthStore.getState().accessToken
        municipiosApi.list(token, { size: 1000 })
            .then(res => {
                if (!cancelled) setMunicipios(res.content ?? [])
            })
            .catch(() => { if (!cancelled) setMunicipios([]) })
            .finally(() => { if (!cancelled) setLoadingMunicipios(false) })
        return () => { cancelled = true }
    }, [isOpen, isSuperAdmin])

    const reset = () => {
        setFile(null)
        setError(null)
        setShowConfirm(false)
        setSubmitting(false)
        setMunicipioId('')
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleClose = () => {
        reset()
        onClose()
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0]
        setError(null)
        if (selected) {
            if (!selected.name.endsWith('.xlsx')) {
                setError('Selecione um arquivo .xlsx válido')
                setFile(null)
                return
            }
            setFile(selected)
        }
    }

    const handleImportClick = () => {
        if (!file) return
        if (isSuperAdmin && !municipioId) {
            setError('Selecione o município de destino')
            return
        }
        const fileKey = `${file.name}_${file.size}_${file.lastModified}`
        if (lastImportedFileRef.current === fileKey) {
            setShowConfirm(true)
            return
        }
        doImport()
    }

    const doImport = async () => {
        if (!file || submitting) return
        setSubmitting(true)
        setShowConfirm(false)
        setError(null)
        try {
            const token = useAuthStore.getState().accessToken
            const target = isSuperAdmin && typeof municipioId === 'number' ? municipioId : null
            const { jobId } = await usuariosApi.startImport(file, target, token)
            lastImportedFileRef.current = `${file.name}_${file.size}_${file.lastModified}`
            useUsuarioImportJobStore.getState().start(jobId, file.name)
            handleClose()
        } catch (err) {
            setError((err as Error).message || 'Erro ao iniciar importação')
            setSubmitting(false)
        }
    }

    if (!isOpen) return null

    return (
        <>
            <div className="modal fade show d-block" tabIndex={-1}>
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content border-0 shadow">
                        <div className="modal-header bg-primary text-white">
                            <h5 className="modal-title">
                                <i className="bi bi-file-earmark-person me-2"></i>
                                Importar Usuários
                            </h5>
                            <button type="button" className="btn-close btn-close-white" onClick={handleClose} disabled={submitting}></button>
                        </div>
                        <div className="modal-body p-4">
                            {error && (
                                <div className="alert alert-danger d-flex align-items-center">
                                    <i className="bi bi-exclamation-triangle me-2"></i>{error}
                                </div>
                            )}

                            {showConfirm && (
                                <div className="alert alert-warning">
                                    <div className="d-flex align-items-center mb-2">
                                        <i className="bi bi-exclamation-triangle me-2"></i>
                                        <strong>Este arquivo já foi importado.</strong>
                                    </div>
                                    <p className="mb-2 small">Importar novamente pode gerar conflitos de email. Deseja continuar?</p>
                                    <div className="d-flex gap-2">
                                        <button type="button" className="btn btn-warning btn-sm" onClick={doImport}>
                                            Sim, importar novamente
                                        </button>
                                        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowConfirm(false)}>
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            )}

                            {isSuperAdmin && (
                                <div className="mb-3">
                                    <label className="form-label fw-medium">Município de destino</label>
                                    <select
                                        className="form-select"
                                        value={municipioId}
                                        onChange={e => setMunicipioId(e.target.value ? Number(e.target.value) : '')}
                                        disabled={submitting || loadingMunicipios}
                                    >
                                        <option value="">{loadingMunicipios ? 'Carregando municípios...' : 'Selecione um município'}</option>
                                        {municipios.map(m => (
                                            <option key={m.id} value={m.id}>{m.nome}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="mb-3">
                                <label className="form-label fw-medium">Arquivo Excel (.xlsx)</label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="form-control"
                                    accept=".xlsx"
                                    onChange={handleFileChange}
                                    disabled={submitting}
                                />
                                <div className="form-text">
                                    Selecione um arquivo .xlsx com os dados dos usuários seguindo o template. A importação roda em segundo plano — você pode continuar usando o sistema enquanto ela processa.
                                </div>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                <a
                                    className={`btn btn-outline-primary btn-sm${submitting ? ' disabled' : ''}`}
                                    href={TEMPLATE_URL}
                                    download="import-usuario-template.xlsx"
                                >
                                    <i className="bi bi-download me-1"></i>Download Template
                                </a>
                            </div>
                        </div>
                        <div className="modal-footer bg-light">
                            <button type="button" className="btn btn-outline-secondary" onClick={handleClose} disabled={submitting}>
                                Cancelar
                            </button>
                            <button type="button" className="btn btn-primary" onClick={handleImportClick} disabled={!file || submitting}>
                                {submitting
                                    ? <><span className="spinner-border spinner-border-sm me-2"></span>Iniciando...</>
                                    : <><i className="bi bi-upload me-2"></i>Iniciar importação</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show"></div>
        </>
    )
}
