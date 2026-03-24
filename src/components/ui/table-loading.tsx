interface TableLoadingProps {
    isLoading: boolean
    children: React.ReactNode
}

export function TableLoading({ isLoading, children }: TableLoadingProps) {
    return (
        <div className="position-relative">
            {children}
            {isLoading && (
                <div
                    className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)', zIndex: 10 }}
                >
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Carregando...</span>
                    </div>
                </div>
            )}
        </div>
    )
}
