import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
    title: string
    value: string | number
    icon: LucideIcon
    trend?: {
        value: number
        isPositive: boolean
    }
    className?: string
}

export function StatCard({ title, value, icon: Icon, trend, className }: StatCardProps) {
    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-xl bg-white border border-slate-200 p-6 shadow-sm",
                className
            )}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
                    {trend && (
                        <p
                            className={cn(
                                "mt-1 text-sm font-medium",
                                trend.isPositive ? "text-success-600" : "text-error-600"
                            )}
                        >
                            {trend.isPositive ? "+" : ""}{trend.value}%
                            <span className="text-slate-500 font-normal ml-1">vs mês anterior</span>
                        </p>
                    )}
                </div>
                <div className="rounded-lg bg-primary-50 p-3">
                    <Icon className="h-6 w-6 text-primary-600" />
                </div>
            </div>

            {/* Decorative gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-accent-500" />
        </div>
    )
}
