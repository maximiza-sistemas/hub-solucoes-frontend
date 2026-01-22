import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    description?: string
    children: React.ReactNode
    className?: string
    size?: "sm" | "default" | "lg" | "xl" | "full"
}

const sizeClasses = {
    sm: "max-w-md",
    default: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[90vw]",
}

export function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
    className,
    size = "default",
}: ModalProps) {
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = "unset"
        }
        return () => {
            document.body.style.overflow = "unset"
        }
    }, [isOpen])

    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }
        if (isOpen) {
            window.addEventListener("keydown", handleEscape)
        }
        return () => window.removeEventListener("keydown", handleEscape)
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div
                className={cn(
                    "relative z-10 w-full mx-4 bg-white rounded-xl shadow-xl animate-[scale-in_0.2s_ease-out]",
                    sizeClasses[size],
                    className
                )}
            >
                {/* Header */}
                {(title || description) && (
                    <div className="flex items-start justify-between p-6 border-b border-slate-200">
                        <div>
                            {title && (
                                <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                            )}
                            {description && (
                                <p className="mt-1 text-sm text-slate-500">{description}</p>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="shrink-0 -mr-2 -mt-2"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                {/* Body */}
                <div className="p-6">{children}</div>
            </div>
        </div>
    )
}

interface ModalFooterProps {
    children: React.ReactNode
    className?: string
}

export function ModalFooter({ children, className }: ModalFooterProps) {
    return (
        <div
            className={cn(
                "flex items-center justify-end gap-3 pt-6 border-t border-slate-200 -mx-6 -mb-6 px-6 pb-6 mt-6",
                className
            )}
        >
            {children}
        </div>
    )
}
