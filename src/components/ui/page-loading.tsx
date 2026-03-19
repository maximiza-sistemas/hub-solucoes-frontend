interface PageLoadingProps {
    message?: string
}

export function PageLoading({ message = 'Carregando...' }: PageLoadingProps) {
    return (
        <div
            className="d-flex flex-column align-items-center justify-content-center animate-fadeIn"
            style={{ minHeight: '60vh' }}
        >
            <div className="spinner-border text-primary mb-3" role="status" style={{ width: 48, height: 48 }}>
                <span className="visually-hidden">{message}</span>
            </div>
            <p className="text-muted">{message}</p>
        </div>
    )
}
