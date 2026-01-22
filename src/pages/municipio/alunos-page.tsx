import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDataStore } from '@/stores'

export function MunicipioAlunosPage() {
    const { municipioId } = useParams()
    const navigate = useNavigate()
    const { municipios, alunos } = useDataStore()
    const [searchTerm, setSearchTerm] = useState('')
    const [escolaFilter, setEscolaFilter] = useState<string>('todas')

    const municipio = municipios.find((m) => m.id === municipioId)
    const municipioAlunos = alunos.filter((a) => a.municipioId === municipioId)

    const escolas = [...new Set(municipioAlunos.map(a => a.escola))]

    const filteredAlunos = municipioAlunos.filter((a) => {
        const matchesSearch = a.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.matricula.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesEscola = escolaFilter === 'todas' || a.escola === escolaFilter
        return matchesSearch && matchesEscola
    })

    if (!municipio) {
        return (
            <div className="d-flex align-items-center justify-content-center" style={{ height: '50vh' }}>
                <div className="text-center">
                    <i className="bi bi-exclamation-triangle text-warning" style={{ fontSize: 48 }}></i>
                    <p className="text-muted mt-3">Município não encontrado</p>
                </div>
            </div>
        )
    }

    return (
        <div className="animate-fadeIn">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                        <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => navigate(`/municipio/${municipioId}/dashboard`)}
                        >
                            <i className="bi bi-arrow-left"></i>
                        </button>
                        <h1 className="h3 fw-bold text-dark mb-0">Alunos</h1>
                    </div>
                    <p className="text-muted mb-0">{municipio.nome} - {municipio.estado}</p>
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-outline-primary">
                        <i className="bi bi-upload me-2"></i>
                        Importar Planilha
                    </button>
                    <button className="btn btn-primary">
                        <i className="bi bi-plus-lg me-2"></i>
                        Novo Aluno
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="row g-3 mb-4">
                <div className="col-6 col-lg-3">
                    <div className="card border-0 shadow-sm bg-info text-white">
                        <div className="card-body py-3">
                            <div className="d-flex align-items-center gap-3">
                                <i className="bi bi-mortarboard" style={{ fontSize: 28 }}></i>
                                <div>
                                    <p className="h4 fw-bold mb-0">{municipioAlunos.length}</p>
                                    <p className="small mb-0 opacity-75">Total de Alunos</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-lg-3">
                    <div className="card border-0 shadow-sm bg-success text-white">
                        <div className="card-body py-3">
                            <div className="d-flex align-items-center gap-3">
                                <i className="bi bi-check-circle" style={{ fontSize: 28 }}></i>
                                <div>
                                    <p className="h4 fw-bold mb-0">{municipioAlunos.filter(a => a.status === 'ativo').length}</p>
                                    <p className="small mb-0 opacity-75">Ativos</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-lg-3">
                    <div className="card border-0 shadow-sm bg-primary text-white">
                        <div className="card-body py-3">
                            <div className="d-flex align-items-center gap-3">
                                <i className="bi bi-building" style={{ fontSize: 28 }}></i>
                                <div>
                                    <p className="h4 fw-bold mb-0">{escolas.length}</p>
                                    <p className="small mb-0 opacity-75">Escolas</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-lg-3">
                    <div className="card border-0 shadow-sm bg-warning text-dark">
                        <div className="card-body py-3">
                            <div className="d-flex align-items-center gap-3">
                                <i className="bi bi-book" style={{ fontSize: 28 }}></i>
                                <div>
                                    <p className="h4 fw-bold mb-0">{new Set(municipioAlunos.map(a => a.serie)).size}</p>
                                    <p className="small mb-0">Séries</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-12 col-md-6 col-lg-4">
                            <div className="input-group">
                                <span className="input-group-text bg-white">
                                    <i className="bi bi-search text-muted"></i>
                                </span>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Buscar aluno ou matrícula..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="col-12 col-md-6 col-lg-3">
                            <select
                                className="form-select"
                                value={escolaFilter}
                                onChange={(e) => setEscolaFilter(e.target.value)}
                            >
                                <option value="todas">Todas as escolas</option>
                                {escolas.map(escola => (
                                    <option key={escola} value={escola}>{escola}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Students Table */}
            <div className="card border-0 shadow-sm">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th className="border-0">Aluno</th>
                                    <th className="border-0">Matrícula</th>
                                    <th className="border-0">Escola</th>
                                    <th className="border-0">Série/Turma</th>
                                    <th className="border-0">Status</th>
                                    <th className="border-0 text-end">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAlunos.map((aluno) => (
                                    <tr key={aluno.id}>
                                        <td className="align-middle">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="d-flex align-items-center justify-content-center rounded-circle bg-info bg-opacity-10 text-info"
                                                    style={{ width: 40, height: 40, fontSize: 14 }}>
                                                    {aluno.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="fw-medium mb-0">{aluno.nome}</p>
                                                    <p className="text-muted small mb-0">{aluno.responsavelNome}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="align-middle">
                                            <code className="bg-light px-2 py-1 rounded">{aluno.matricula}</code>
                                        </td>
                                        <td className="align-middle">{aluno.escola}</td>
                                        <td className="align-middle">{aluno.serie} - {aluno.turma}</td>
                                        <td className="align-middle">
                                            <span className={`badge ${aluno.status === 'ativo' ? 'bg-success' : 'bg-secondary'}`}>
                                                {aluno.status}
                                            </span>
                                        </td>
                                        <td className="align-middle text-end">
                                            <div className="btn-group btn-group-sm">
                                                <button className="btn btn-outline-primary">
                                                    <i className="bi bi-eye"></i>
                                                </button>
                                                <button className="btn btn-outline-secondary">
                                                    <i className="bi bi-pencil"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {filteredAlunos.length === 0 && (
                <div className="text-center py-5">
                    <i className="bi bi-inbox text-muted" style={{ fontSize: 48 }}></i>
                    <p className="text-muted mt-3">Nenhum aluno encontrado</p>
                </div>
            )}
        </div>
    )
}
