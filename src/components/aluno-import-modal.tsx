import { useState, useRef } from 'react'
import { alunosApi } from '@/services/api'
import { useAuthStore } from '@/stores/auth-store'
import { downloadAlunoTemplate } from '@/lib/aluno-template'
import type { ImportResult } from '@/types'

interface AlunoImportModalProps {
    isOpen: boolean
    onClose: () => void
    onImportSuccess: () => void
}

type ModalState = 'idle' | 'uploading' | 'result'

export function AlunoImportModal({ isOpen, onClose, onImportSuccess }: AlunoImportModalProps) {
    const [state, setState] = useState<ModalState>('idle')
    const [file, setFile] = useState<File | null>(null)
    const [result, setResult] = useState<ImportResult | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [showConfirm, setShowConfirm] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const importingRef = useRef(false)
    const lastImportedFileRef = useRef<string | null>(null)

    const reset = () => {
        setState('idle')
        setFile(null)
        setResult(null)
        setError(null)
        setShowConfirm(false)
        importingRef.current = false
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleClose = () => {
        if (result && result.sucesso > 0) {
            onImportSuccess()
        }
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
        if (!file || importingRef.current) return
        importingRef.current = true
        setShowConfirm(false)
        setState('uploading')
        setError(null)
        try {
            const token = useAuthStore.getState().accessToken
            const importResult = await alunosApi.importFile(file, token)
            lastImportedFileRef.current = `${file.name}_${file.size}_${file.lastModified}`
            setResult(importResult)
            setState('result')
        } catch (err) {
            setError((err as Error).message || 'Erro ao importar arquivo')
            setState('idle')
        } finally {
            importingRef.current = false
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
                            <button type="button" className="btn-close btn-close-white" onClick={handleClose} disabled={state === 'uploading'}></button>
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

                            {state !== 'result' && (
                                <>
                                    <div className="mb-3">
                                        <label className="form-label fw-medium">Arquivo Excel (.xlsx)</label>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            className="form-control"
                                            accept=".xlsx"
                                            onChange={handleFileChange}
                                            disabled={state === 'uploading'}
                                        />
                                        <div className="form-text">
                                            Selecione um arquivo .xlsx com os dados dos alunos seguindo o template.
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        <button
                                            type="button"
                                            className="btn btn-outline-success btn-sm"
                                            onClick={downloadAlunoTemplate}
                                            disabled={state === 'uploading'}
                                        >
                                            <i className="bi bi-download me-1"></i>Download Template
                                        </button>
                                    </div>
                                </>
                            )}

                            {state === 'uploading' && (
                                <div className="text-center py-4">
                                    <div className="spinner-border text-success mb-3" role="status">
                                        <span className="visually-hidden">Importando...</span>
                                    </div>
                                    <p className="text-muted mb-0">Importando alunos, aguarde...</p>
                                </div>
                            )}

                            {state === 'result' && result && (
                                <div>
                                    <div className="d-flex gap-3 mb-4">
                                        <div className="flex-fill text-center p-3 rounded bg-light">
                                            <div className="fs-4 fw-bold text-primary">{result.totalLinhas}</div>
                                            <small className="text-muted">Total de Linhas</small>
                                        </div>
                                        <div className="flex-fill text-center p-3 rounded bg-success bg-opacity-10">
                                            <div className="fs-4 fw-bold text-success">{result.sucesso}</div>
                                            <small className="text-muted">Importados</small>
                                        </div>
                                        <div className="flex-fill text-center p-3 rounded bg-danger bg-opacity-10">
                                            <div className="fs-4 fw-bold text-danger">{result.erros}</div>
                                            <small className="text-muted">Erros</small>
                                        </div>
                                    </div>

                                    {result.falhas.length > 0 && (
                                        <div>
                                            <h6 className="fw-medium mb-2">Detalhes dos erros:</h6>
                                            <div className="table-responsive" style={{ maxHeight: 250 }}>
                                                <table className="table table-sm table-bordered mb-0">
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th style={{ width: 70 }}>Linha</th>
                                                            <th>Aluno</th>
                                                            <th>Motivo</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {result.falhas.map((f, i) => (
                                                            <tr key={i}>
                                                                <td>{f.linha}</td>
                                                                <td>{f.aluno}</td>
                                                                <td className="text-danger">{f.motivo}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer bg-light">
                            {state !== 'result' ? (
                                <>
                                    <button type="button" className="btn btn-outline-secondary" onClick={handleClose} disabled={state === 'uploading'}>
                                        Cancelar
                                    </button>
                                    <button type="button" className="btn btn-success" onClick={handleImportClick} disabled={!file || state === 'uploading'}>
                                        {state === 'uploading'
                                            ? <><span className="spinner-border spinner-border-sm me-2"></span>Importando...</>
                                            : <><i className="bi bi-upload me-2"></i>Importar</>}
                                    </button>
                                </>
                            ) : (
                                <button type="button" className="btn btn-primary" onClick={handleClose}>
                                    <i className="bi bi-check-lg me-2"></i>Fechar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show"></div>
        </>
    )
}
