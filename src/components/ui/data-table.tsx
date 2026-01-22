import * as React from "react"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Input } from "./input"

interface Column<T> {
    key: keyof T | string
    header: string
    render?: (item: T) => React.ReactNode
    sortable?: boolean
    className?: string
}

interface DataTableProps<T> {
    data: T[]
    columns: Column<T>[]
    searchable?: boolean
    searchPlaceholder?: string
    searchKeys?: (keyof T)[]
    pageSize?: number
    emptyMessage?: string
    onRowClick?: (item: T) => void
    className?: string
}

export function DataTable<T extends { id: string | number }>({
    data,
    columns,
    searchable = true,
    searchPlaceholder = "Buscar...",
    searchKeys = [],
    pageSize = 10,
    emptyMessage = "Nenhum registro encontrado",
    onRowClick,
    className,
}: DataTableProps<T>) {
    const [search, setSearch] = React.useState("")
    const [currentPage, setCurrentPage] = React.useState(1)
    const [sortConfig, setSortConfig] = React.useState<{
        key: string
        direction: "asc" | "desc"
    } | null>(null)

    // Filter data based on search
    const filteredData = React.useMemo(() => {
        if (!search || searchKeys.length === 0) return data

        const lowerSearch = search.toLowerCase()
        return data.filter((item) =>
            searchKeys.some((key) => {
                const value = item[key]
                return String(value).toLowerCase().includes(lowerSearch)
            })
        )
    }, [data, search, searchKeys])

    // Sort data
    const sortedData = React.useMemo(() => {
        if (!sortConfig) return filteredData

        return [...filteredData].sort((a, b) => {
            const aValue = (a as Record<string, unknown>)[sortConfig.key]
            const bValue = (b as Record<string, unknown>)[sortConfig.key]

            if (aValue === null || aValue === undefined) return 1
            if (bValue === null || bValue === undefined) return -1

            if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
            if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
            return 0
        })
    }, [filteredData, sortConfig])

    // Pagination
    const totalPages = Math.ceil(sortedData.length / pageSize)
    const paginatedData = sortedData.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    )

    const handleSort = (key: string) => {
        setSortConfig((current) => {
            if (current?.key !== key) return { key, direction: "asc" }
            if (current.direction === "asc") return { key, direction: "desc" }
            return null
        })
    }

    React.useEffect(() => {
        setCurrentPage(1)
    }, [search])

    return (
        <div className={cn("space-y-4", className)}>
            {/* Search */}
            {searchable && (
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder={searchPlaceholder}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={String(column.key)}
                                    className={cn(
                                        "px-4 py-3 text-left font-medium text-slate-600",
                                        column.sortable && "cursor-pointer select-none hover:bg-slate-100",
                                        column.className
                                    )}
                                    onClick={() => column.sortable && handleSort(String(column.key))}
                                >
                                    <div className="flex items-center gap-2">
                                        {column.header}
                                        {sortConfig?.key === String(column.key) && (
                                            <span className="text-primary-600">
                                                {sortConfig.direction === "asc" ? "↑" : "↓"}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {paginatedData.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="px-4 py-8 text-center text-slate-500"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((item) => (
                                <tr
                                    key={item.id}
                                    className={cn(
                                        "bg-white transition-colors",
                                        onRowClick && "cursor-pointer hover:bg-slate-50"
                                    )}
                                    onClick={() => onRowClick?.(item)}
                                >
                                    {columns.map((column) => (
                                        <td
                                            key={String(column.key)}
                                            className={cn("px-4 py-3 text-slate-700", column.className)}
                                        >
                                            {column.render
                                                ? column.render(item)
                                                : String((item as Record<string, unknown>)[String(column.key)] ?? "")}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                        Mostrando {(currentPage - 1) * pageSize + 1} a{" "}
                        {Math.min(currentPage * pageSize, sortedData.length)} de{" "}
                        {sortedData.length} registros
                    </p>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setCurrentPage((p) => p - 1)}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="px-3 text-sm text-slate-600">
                            {currentPage} / {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setCurrentPage((p) => p + 1)}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
