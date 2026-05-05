import { useState, useRef, useEffect } from 'react'

export interface SearchableSelectOption {
    id: number | string
    label: string
}

interface SearchableSelectProps {
    options: SearchableSelectOption[]
    value: string
    onChange: (value: string) => void
    placeholder?: string
    emptyOptionLabel?: string
    emptyMessage?: string
    disabled?: boolean
    isInvalid?: boolean
    required?: boolean
    className?: string
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'Pesquisar...',
    emptyOptionLabel,
    emptyMessage = 'Nenhum resultado encontrado',
    disabled = false,
    isInvalid = false,
    required = false,
    className = '',
}: SearchableSelectProps) {
    const [search, setSearch] = useState('')
    const [open, setOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false)
                setSearch('')
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [open])

    const selected = options.find(o => String(o.id) === value)
    const selectedLabel = selected?.label || ''

    const filtered = options.filter(o =>
        o.label.toLowerCase().includes(search.toLowerCase())
    )

    const inputClass = `form-control ${isInvalid ? 'is-invalid' : ''} ${className}`.trim()

    const commitSelect = (id: string) => {
        onChange(id)
        setSearch('')
        setOpen(false)
    }

    return (
        <div className="position-relative" ref={containerRef}>
            <input
                type="text"
                className={inputClass}
                placeholder={placeholder}
                value={open ? search : selectedLabel}
                onChange={e => {
                    setSearch(e.target.value)
                    setOpen(true)
                    if (!e.target.value && value) onChange('')
                }}
                onFocus={() => { if (!disabled) setOpen(true) }}
                onClick={() => { if (!disabled) setOpen(true) }}
                disabled={disabled}
                required={required && !value}
                autoComplete="off"
            />
            {value && !open && !disabled && (
                <button
                    type="button"
                    className="btn btn-sm position-absolute end-0 top-50 translate-middle-y me-2 p-0 border-0 bg-transparent text-muted"
                    onMouseDown={e => { e.preventDefault(); onChange(''); setSearch(''); setOpen(true) }}
                    tabIndex={-1}
                >
                    <i className="bi bi-x-lg"></i>
                </button>
            )}
            {open && (
                <div
                    className="border rounded shadow-sm bg-white position-absolute w-100 mt-1"
                    style={{ maxHeight: 200, overflowY: 'auto', zIndex: 1060 }}
                >
                    {emptyOptionLabel && (
                        <div
                            role="button"
                            className={`dropdown-item px-3 py-2 ${value === '' ? 'active' : ''}`}
                            onMouseDown={e => { e.preventDefault(); commitSelect('') }}
                            style={{ cursor: 'pointer' }}
                        >
                            {emptyOptionLabel}
                        </div>
                    )}
                    {filtered.length > 0 ? filtered.map(o => (
                        <div
                            role="button"
                            key={o.id}
                            className={`dropdown-item px-3 py-2 ${String(o.id) === value ? 'active' : ''}`}
                            onMouseDown={e => { e.preventDefault(); commitSelect(String(o.id)) }}
                            style={{ cursor: 'pointer' }}
                        >
                            {o.label}
                        </div>
                    )) : (
                        !emptyOptionLabel && <div className="px-3 py-2 text-muted small">{emptyMessage}</div>
                    )}
                </div>
            )}
        </div>
    )
}
