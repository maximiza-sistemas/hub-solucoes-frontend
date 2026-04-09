import { useState } from 'react'
import { useImportJobStore } from '@/stores/import-job-store'
import type { ImportJobProgress } from '@/types'

type Tab = 'cadastrados' | 'existentes' | 'falhas'

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

function csvEscape(value: string | number | null | undefined): string {
    if (value == null) return ''
    const s = String(value)
    if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes(';')) {
        return `"${s.replace(/"/g, '""')}"`
    }
    return s
}

function downloadCsv(filename: string, rows: string[][]) {
    // BOM + CRLF para compatibilidade com Excel
    const csv = '\ufeff' + rows.map(r => r.map(csvEscape).join(',')).join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

function exportarFalhas(progress: ImportJobProgress) {
    const rows: string[][] = [['linha', 'aluno', 'motivo']]
    for (const f of progress.falhas) {
        rows.push([String(f.linha), f.aluno, f.motivo])
    }
    const baseName = (progress.fileName || 'importacao').replace(/\.[^.]+$/, '')
    downloadCsv(`${baseName}_falhas.csv`, rows)
}

export function ImportProgressPanel() {
    const { progress, fileName, cancelling, cancel, dismiss } = useImportJobStore()
    const [collapsed, setCollapsed] = useState(false)
    const [maximized, setMaximized] = useState(false)
    const [confirmCancel, setConfirmCancel] = useState(false)
    const [tab, setTab] = useState<Tab>('cadastrados')

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

    const containerClass = maximized
        ? 'position-fixed top-50 start-50 translate-middle shadow-lg rounded border bg-white d-flex flex-column'
        : 'position-fixed bottom-0 end-0 m-3 shadow-lg rounded border bg-white d-flex flex-column'

    const containerStyle: React.CSSProperties = maximized
        ? { width: 'min(900px, 95vw)', height: 'min(80vh, 720px)', zIndex: 1080 }
        : { width: 460, maxWidth: '95vw', maxHeight: '80vh', zIndex: 1080 }

    const bodyStyle: React.CSSProperties = { overflowY: 'auto', flex: 1 }

    const panelInner = (
        <div className={containerClass} style={containerStyle}>
            <div className={`d-flex align-items-center justify-content-between px-3 py-2 ${headerClass} rounded-top`}>
                <div className="d-flex align-items-center gap-2 text-truncate">
                    <i className="bi bi-file-earmark-excel"></i>
                    <strong className="text-truncate" title={fileName ?? undefined}>{headerTitle}</strong>
                </div>
                <div className="d-flex align-items-center gap-1">
                    {!maximized && (
                        <button
                            type="button"
                            className="btn btn-sm btn-link text-reset p-0 px-1"
                            onClick={() => setCollapsed(c => !c)}
                            title={collapsed ? 'Expandir' : 'Recolher'}
                        >
                            <i className={`bi ${collapsed ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
                        </button>
                    )}
                    <button
                        type="button"
                        className="btn btn-sm btn-link text-reset p-0 px-1"
                        onClick={() => { setMaximized(m => !m); setCollapsed(false) }}
                        title={maximized ? 'Restaurar' : 'Ampliar'}
                    >
                        <i className={`bi ${maximized ? 'bi-fullscreen-exit' : 'bi-arrows-fullscreen'}`}></i>
                    </button>
                    {isFinal && (
                        <button
                            type="button"
                            className="btn btn-sm btn-link text-reset p-0 px-1"
                            onClick={() => { setConfirmCancel(false); setTab('cadastrados'); setMaximized(false); dismiss() }}
                            title="Fechar"
                        >
                            <i className="bi bi-x-lg"></i>
                        </button>
                    )}
                </div>
            </div>

            {!collapsed && (
                <div className="p-3" style={bodyStyle}>
                    {fileName && (
                        <div className="small text-muted text-truncate mb-2" title={fileName}>
                            <i className="bi bi-paperclip me-1"></i>{fileName}
                        </div>
                    )}

                    {status === 'FAILED' && (
                        <div className="alert alert-danger mb-3">
                            <strong>Erro:</strong> {progress.erroFatal || 'Falha desconhecida'}
                        </div>
                    )}

                    {status === 'CANCELLED' && (
                        <div className="alert alert-warning py-2 mb-3 small">
                            <i className="bi bi-exclamation-triangle me-1"></i>
                            Cancelada após {progress.sucesso} de {progress.totalLinhas} alunos.
                        </div>
                    )}

                    <SummaryHeader progress={progress} maximized={maximized} showProgressBar={!isFinal} />

                    {progress.erros > 0 && (
                        <div className="mb-2">
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-primary w-100"
                                onClick={() => exportarFalhas(progress)}
                                disabled={!isFinal}
                                title={isFinal ? 'Baixar CSV com todas as falhas' : 'Disponível ao final da importação'}
                            >
                                <i className="bi bi-download me-1"></i>
                                Baixar CSV de falhas ({progress.erros})
                                {!isFinal && <small className="ms-1 text-muted">(disponível ao final)</small>}
                            </button>
                        </div>
                    )}

                    {status !== 'FAILED' && (
                        <TabsView progress={progress} tab={tab} setTab={setTab} maximized={maximized} />
                    )}

                    {!isFinal && (
                        <div className="mt-3">
                            {!confirmCancel ? (
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger w-100"
                                    onClick={() => setConfirmCancel(true)}
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
                                        <button type="button" className="btn btn-sm btn-danger flex-fill"
                                                onClick={() => { setConfirmCancel(false); cancel() }}>
                                            Sim, cancelar
                                        </button>
                                        <button type="button" className="btn btn-sm btn-outline-secondary flex-fill"
                                                onClick={() => setConfirmCancel(false)}>
                                            Voltar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )

    if (maximized) {
        return (
            <>
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 bg-dark"
                    style={{ opacity: 0.5, zIndex: 1079 }}
                    onClick={() => setMaximized(false)}
                />
                {panelInner}
            </>
        )
    }
    return panelInner
}

function SummaryHeader({
    progress,
    maximized,
    showProgressBar,
}: {
    progress: ImportJobProgress
    maximized: boolean
    showProgressBar: boolean
}) {
    return (
        <>
            {showProgressBar && (
                <>
                    <div className="progress mb-2" style={{ height: maximized ? 28 : 18 }}>
                        <div
                            className="progress-bar progress-bar-striped progress-bar-animated"
                            style={{ width: `${progress.percentual}%` }}
                        >
                            {progress.percentual}%
                        </div>
                    </div>
                    <div className={`d-flex justify-content-between mb-2 ${maximized ? '' : 'small'}`}>
                        <span><strong>{progress.processadas}</strong> / {progress.totalLinhas} linhas</span>
                        <span className="text-muted">
                            {progress.tempoEstimadoRestanteMs != null
                                ? `~${formatDuration(progress.tempoEstimadoRestanteMs)} restantes`
                                : `${formatDuration(progress.tempoDecorridoMs)} decorrido`}
                        </span>
                    </div>
                </>
            )}
            <div className="d-flex gap-2 mb-3 flex-wrap">
                <div className="flex-fill text-center p-2 rounded bg-light border">
                    <div className={`fw-bold text-success ${maximized ? 'fs-3' : ''}`}>{progress.sucesso}</div>
                    <small className="text-muted">cadastrados</small>
                </div>
                <div className="flex-fill text-center p-2 rounded bg-light border">
                    <div className={`fw-bold text-info ${maximized ? 'fs-3' : ''}`}>{progress.existentes}</div>
                    <small className="text-muted">já cadastrados</small>
                </div>
                <div className="flex-fill text-center p-2 rounded bg-light border">
                    <div className={`fw-bold text-danger ${maximized ? 'fs-3' : ''}`}>{progress.erros}</div>
                    <small className="text-muted">erros</small>
                </div>
            </div>
        </>
    )
}

function TabsView({
    progress,
    tab,
    setTab,
    maximized,
}: {
    progress: ImportJobProgress
    tab: Tab
    setTab: (t: Tab) => void
    maximized: boolean
}) {
    const tableHeight = maximized ? '50vh' : 220
    const isRunning = progress.status === 'QUEUED' || progress.status === 'RUNNING'

    return (
        <>
            <ul className="nav nav-tabs nav-fill mb-2 small">
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
                        className={`nav-link ${tab === 'existentes' ? 'active' : ''}`}
                        onClick={() => setTab('existentes')}
                    >
                        Já cadastrados ({progress.existentes})
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

            {tab === 'cadastrados' && (
                <ResumoTable
                    rows={progress.cadastrados}
                    total={progress.sucesso}
                    isRunning={isRunning}
                    tableHeight={tableHeight}
                    emptyMessage="Nenhum aluno cadastrado ainda."
                    columns={['Linha', 'Nome', 'CPF']}
                    renderRow={(c, i) => (
                        <tr key={`${c.cpf}-${i}`}>
                            <td>{c.linha}</td>
                            <td>{c.nome}</td>
                            <td>{c.cpf}</td>
                        </tr>
                    )}
                />
            )}

            {tab === 'existentes' && (
                <ResumoTable
                    rows={progress.linhasExistentes}
                    total={progress.existentes}
                    isRunning={isRunning}
                    tableHeight={tableHeight}
                    emptyMessage="Nenhuma linha já cadastrada."
                    columns={['Linha', 'Nome', 'CPF']}
                    renderRow={(c, i) => (
                        <tr key={`${c.cpf}-${i}`}>
                            <td>{c.linha}</td>
                            <td>{c.nome}</td>
                            <td>{c.cpf}</td>
                        </tr>
                    )}
                />
            )}

            {tab === 'falhas' && (
                <ResumoTable
                    rows={progress.falhas}
                    total={progress.erros}
                    isRunning={isRunning}
                    tableHeight={tableHeight}
                    emptyMessage="Nenhuma falha."
                    columns={['Linha', 'Aluno', 'Motivo']}
                    renderRow={(f, i) => (
                        <tr key={i}>
                            <td>{f.linha}</td>
                            <td>{f.aluno}</td>
                            <td className="text-danger">{f.motivo}</td>
                        </tr>
                    )}
                />
            )}
        </>
    )
}

function ResumoTable<T>({
    rows,
    total,
    isRunning,
    tableHeight,
    emptyMessage,
    columns,
    renderRow,
}: {
    rows: T[]
    total: number
    isRunning: boolean
    tableHeight: number | string
    emptyMessage: string
    columns: string[]
    renderRow: (row: T, i: number) => React.ReactNode
}) {
    if (rows.length === 0) {
        return <p className="text-muted small mb-0">{emptyMessage}</p>
    }
    const truncated = isRunning && total > rows.length
    return (
        <>
            {truncated && (
                <div className="small text-muted mb-1">
                    Mostrando os últimos {rows.length} de {total} (atualizando...)
                </div>
            )}
            <div className="table-responsive" style={{ maxHeight: tableHeight }}>
                <table className="table table-sm table-bordered mb-0">
                    <thead className="table-light">
                        <tr>
                            {columns.map((col, i) => (
                                <th key={col} style={i === 0 ? { width: 60 } : undefined}>{col}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(renderRow)}
                    </tbody>
                </table>
            </div>
        </>
    )
}
