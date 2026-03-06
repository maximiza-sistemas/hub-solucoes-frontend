interface PaginationProps {
    currentPage: number
    pageSize: number
    totalElements: number
    totalPages: number
    onPageChange: (page: number) => void
    onPageSizeChange: (size: number) => void
    label?: string
    isLoading?: boolean
}

export function Pagination({
    currentPage,
    pageSize,
    totalElements,
    totalPages,
    onPageChange,
    onPageSizeChange,
    label = 'registros',
    isLoading = false
}: PaginationProps) {
    const showingFrom = totalElements > 0 ? currentPage * pageSize + 1 : 0
    const showingTo = totalElements > 0 ? Math.min(currentPage * pageSize + pageSize, totalElements) : 0

    return (
        <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-2">
                <span className="text-muted small">Itens por página:</span>
                <select
                    className="form-select form-select-sm"
                    style={{ width: 90 }}
                    value={pageSize}
                    onChange={(e) => onPageSizeChange(Number(e.target.value))}
                    disabled={isLoading}
                >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                </select>
            </div>
            <div className="d-flex align-items-center gap-3">
                <span className="text-muted small">
                    Mostrando {showingFrom}-{showingTo} de {totalElements} {label}
                </span>
                <div className="btn-group btn-group-sm">
                    <button
                        className="btn btn-outline-secondary"
                        disabled={currentPage === 0 || isLoading}
                        onClick={() => onPageChange(currentPage - 1)}
                        title="Anterior"
                    >
                        <i className="bi bi-chevron-left"></i>
                    </button>
                    <button
                        className="btn btn-outline-secondary"
                        disabled={currentPage >= (totalPages - 1) || isLoading}
                        onClick={() => onPageChange(currentPage + 1)}
                        title="Próximo"
                    >
                        <i className="bi bi-chevron-right"></i>
                    </button>
                </div>
            </div>
        </div>
    )
}
