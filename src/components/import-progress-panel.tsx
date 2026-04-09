import { useState } from 'react'
import { useImportJobStore } from '@/stores/import-job-store'
import type { ImportJobProgress } from '@/types'

type Tab = 'resumo' | 'cadastrados' | 'falhas'

function formatDuration(ms: number | null | undefined): string {
    if (ms == null || ms < 0) return '—'
    const s = Math.floor(ms / 1000)
    if (s < 60) return `${s}s`
    const m = Math.floor(s / 60)
    const restoS = s % 60
    if (m < 60) return `${m}m ${restoS}s`
    const h = Math.floor(m / 60)
    const restoM = m % 60
    return `${h}h ${restoM}m`
}

export function ImportProgressPanel() {
    const { progress, fileName, cancelling, cancel, dismiss } = useImportJobStore()
    const [collapsed, setCollapsed] = useState(false)
    const [confirmCancel, setConfirmCancel] = useState(false)
    const [tab, setTab] = useState<Tab>('resumo')

    if (!progress) return null

    const status = progress.status
    const isFinal = status === 'COMPLETED' || status === 'CANCELLED' || status === 'FAILED'

    const headerClass = (() => {
        if (status === 'COMPLETED') return 'bg-success text-white'
        if (status === 'CANCELLED') return 'bg-warning'
        if (status === 'FAILED') return 'bg-danger text-white'
        return 'bg-primary text-white'
    })()

    const headerTitle = (() => {
        if (status === 'COMPLETED') return 'Importação concluída'
        if (status === 'CANCELLED') return 'Importação cancelada'
        if (status === 'FAILED') return 'Importação falhou'
        return 'Importando alunos...'
    })()

    return (
        <div
            className="position-fixed bottom-0 end-0 m-3 shadow-lg rounded border bg-white"
            style={{ width: 420, maxWidth: '95vw', zIndex: 1080 }}
        >
            <div className={`d-flex align-items-center justify-content-between px-3 py-2 ${headerClass} rounded-top`}>
                <div className="d-flex align-items-center gap-2 text-truncate">
                    <i className="bi bi-file-earmark-excel"></i>
                    <strong className="text-truncate" title={fileName ?? undefined}>{headerTitle}</strong>
                </div>
                <div className="d-flex align-items-center gap-1">
                    <button
                        type="button"
                        className="btn btn-sm btn-link text-reset p-0 px-1"
                        onClick={() => setCollapsed(c => !c)}
                        title={collapsed ? 'Expandir' : 'Recolher'}
                    >
                        <i className={`bi ${collapsed ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
                    </button>
                    {isFinal && (
                        <button
                            type="button"
                            className="btn btn-sm btn-link text-reset p-0 px-1"
                            onClick={() => { setConfirmCancel(false); setTab('resumo'); dismiss() }}
                            title="Fechar"
                        >
                            <i className="bi bi-x-lg"></i>
                        </button>
                    )}
                </div>
            </div>

            {!collapsed && (
                <div className="p-3">
                    {fileName && (
                        <div className="small text-muted text-truncate mb-2" title={fileName}>
                            <i className="bi bi-paperclip me-1"></i>{fileName}
                        </div>
                    )}

                    {!isFinal && (
                        <RunningView
                            progress={progress}
                            cancelling={cancelling}
                            confirmCancel={confirmCancel}
                            onAskCancel={() => setConfirmCancel(true)}
                            onConfirmCancel={() => { setConfirmCancel(false); cancel() }}
                            onAbortCancel={() => setConfirmCancel(false)}
                        />
                    )}

                    {isFinal && status === 'FAILED' && (
                        <div className="alert alert-danger mb-0">
                            <strong>Erro:</strong> {progress.erroFatal || 'Falha desconhecida'}
                        </div>
                    )}

                    {isFinal && status !== 'FAILED' && (
                        <FinalView progress={progress} tab={tab} setTab={setTab} cancelled={status === 'CANCELLED'} />
                    )}
                </div>
            )}
        </div>
    )
}

function RunningView({
    progress,
    cancelling,
    confirmCancel,
    onAskCancel,
    onConfirmCancel,
    onAbortCancel,
}: {
    progress: ImportJobProgress
    cancelling: boolean
    confirmCancel: boolean
    onAskCancel: () => void
    onConfirmCancel: () => void
    onAbortCancel: () => void
}) {
    return (
        <>
            <div className="progress mb-2" style={{ height: 18 }}>
                <div
                    className="progress-bar progress-bar-striped progress-bar-animated"
                    style={{ width: `${progress.percentual}%` }}
                >
                    {progress.percentual}%
                </div>
            </div>
            <div className="d-flex justify-content-between small mb-2">
                <span><strong>{progress.processadas}</strong> / {progress.totalLinhas} linhas</span>
                <span className="text-muted">
                    {progress.tempoEstimadoRestanteMs != null
                        ? `~${formatDuration(progress.tempoEstimadoRestanteMs)} restantes`
                        : `${formatDuration(progress.tempoDecorridoMs)} decorrido`}
                </span>
            </div>
            <div className="d-flex gap-2 mb-2">
                <div className="flex-fill text-center p-2 rounded bg-light border">
                    <div className="fw-bold text-success">{progress.sucesso}</div>
                    <small className="text-muted">cadastrados</small>
                </div>
                <div className="flex-fill text-center p-2 rounded bg-light border">
                    <div className="fw-bold text-danger">{progress.erros}</div>
                    <small className="text-muted">erros</small>
                </div>
            </div>

            {progress.cadastrados.length > 0 && (
                <div className="border rounded mb-2" style={{ maxHeight: 120, overflowY: 'auto' }}>
                    <ul className="list-unstyled mb-0 small">
                        {progress.cadastrados.slice(-10).reverse().map((c, i) => (
                            <li key={`${c.cpf}-${i}`} className="px-2 py-1 border-bottom text-truncate">
                                <i className="bi bi-check2 text-success me-1"></i>{c.nome}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {!confirmCancel ? (
                <button
                    type="button"
                    className="btn btn-sm btn-outline-danger w-100"
                    onClick={onAskCancel}
                    disabled={cancelling}
                >
                    {cancelling ? 'Cancelando...' : 'Cancelar importação'}
                </button>
            ) : (
                <div className="border border-warning rounded p-2 small">
                    <div className="mb-2">
                        Tem certeza? Os alunos já cadastrados serão mantidos.
                    </div>
                    <div className="d-flex gap-2">
                        <button type="button" className="btn btn-sm btn-danger flex-fill" onClick={onConfirmCancel}>
                            Sim, cancelar
                        </button>
                        <button type="button" className="btn btn-sm btn-outline-secondary flex-fill" onClick={onAbortCancel}>
                            Voltar
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}

function FinalView({
    progress,
    tab,
    setTab,
    cancelled,
}: {
    progress: ImportJobProgress
    tab: Tab
    setTab: (t: Tab) => void
    cancelled: boolean
}) {
    return (
        <>
            {cancelled && (
                <div className="alert alert-warning py-2 mb-2 small">
                    <i className="bi bi-exclamation-triangle me-1"></i>
                    Cancelada após {progress.sucesso} de {progress.totalLinhas} alunos.
                </div>
            )}

            <ul className="nav nav-tabs nav-fill mb-2 small">
                <li className="nav-item">
                    <button
                        className={`nav-link ${tab === 'resumo' ? 'active' : ''}`}
                        onClick={() => setTab('resumo')}
                    >
                        Resumo
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${tab === 'cadastrados' ? 'active' : ''}`}
                        onClick={() => setTab('cadastrados')}
                    >
                        Cadastrados ({progress.sucesso})
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${tab === 'falhas' ? 'active' : ''}`}
                        onClick={() => setTab('falhas')}
                    >
                        Falhas ({progress.erros})
                    </button>
                </li>
            </ul>

            {tab === 'resumo' && (
                <div className="d-flex gap-2">
                    <div className="flex-fill text-center p-2 rounded bg-light border">
                        <div className="fs-5 fw-bold text-primary">{progress.totalLinhas}</div>
                        <small className="text-muted">total</small>
                    </div>
                    <div className="flex-fill text-center p-2 rounded bg-light border">
                        <div className="fs-5 fw-bold text-success">{progress.sucesso}</div>
                        <small className="text-muted">cadastrados</small>
                    </div>
                    <div className="flex-fill text-center p-2 rounded bg-light border">
                        <div className="fs-5 fw-bold text-danger">{progress.erros}</div>
                        <small className="text-muted">erros</small>
                    </div>
                </div>
            )}

            {tab === 'cadastrados' && (
                <div className="table-responsive" style={{ maxHeight: 240 }}>
                    {progress.cadastrados.length === 0 ? (
                        <p className="text-muted small mb-0">Nenhum aluno cadastrado.</p>
                    ) : (
                        <table className="table table-sm table-bordered mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th style={{ width: 60 }}>Linha</th>
                                    <th>Nome</th>
                                    <th>CPF</th>
                                </tr>
                            </thead>
                            <tbody>
                                {progress.cadastrados.map((c, i) => (
                                    <tr key={`${c.cpf}-${i}`}>
                                        <td>{c.linha}</td>
                                        <td>{c.nome}</td>
                                        <td>{c.cpf}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {tab === 'falhas' && (
                <div className="table-responsive" style={{ maxHeight: 240 }}>
                    {progress.falhas.length === 0 ? (
                        <p className="text-muted small mb-0">Nenhuma falha.</p>
                    ) : (
                        <table className="table table-sm table-bordered mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th style={{ width: 60 }}>Linha</th>
                                    <th>Aluno</th>
                                    <th>Motivo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {progress.falhas.map((f, i) => (
                                    <tr key={i}>
                                        <td>{f.linha}</td>
                                        <td>{f.aluno}</td>
                                        <td className="text-danger">{f.motivo}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </>
    )
}
