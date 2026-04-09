import { useState, useRef } from 'react'
import { alunosApi } from '@/services/api'
import { useAuthStore } from '@/stores/auth-store'
import { useImportJobStore } from '@/stores/import-job-store'
import { downloadAlunoTemplate } from '@/lib/aluno-template'

interface AlunoImportModalProps {
    isOpen: boolean
    onClose: () => void
}

export function AlunoImportModal({ isOpen, onClose }: AlunoImportModalProps) {
    const [file, setFile] = useState<File | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const lastImportedFileRef = useRef<string | null>(null)

    const reset = () => {
        setFile(null)
        setError(null)
        setShowConfirm(false)
        setSubmitting(false)
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
            const { jobId } = await alunosApi.startImport(file, token)
            lastImportedFileRef.current = `${file.name}_${file.size}_${file.lastModified}`
            useImportJobStore.getState().start(jobId, file.name)
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
                        <div className="modal-header bg-success text-white">
                            <h5 className="modal-title">
                                <i className="bi bi-file-earmark-excel me-2"></i>
                                Importar Alunos
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
                                    <p className="mb-2 small">Importar novamente pode gerar alunos duplicados. Deseja continuar?</p>
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
                                    Selecione um arquivo .xlsx com os dados dos alunos seguindo o template. A importação roda em segundo plano — você pode continuar usando o sistema enquanto ela processa.
                                </div>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                <button
                                    type="button"
                                    className="btn btn-outline-success btn-sm"
                                    onClick={downloadAlunoTemplate}
                                    disabled={submitting}
                                >
                                    <i className="bi bi-download me-1"></i>Download Template
                                </button>
                            </div>
                        </div>
                        <div className="modal-footer bg-light">
                            <button type="button" className="btn btn-outline-secondary" onClick={handleClose} disabled={submitting}>
                                Cancelar
                            </button>
                            <button type="button" className="btn btn-success" onClick={handleImportClick} disabled={!file || submitting}>
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
