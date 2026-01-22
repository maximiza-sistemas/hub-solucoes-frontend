import * as React from "react"
import { cn, getInitials } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const avatarVariants = cva(
    "inline-flex items-center justify-center rounded-full font-medium select-none overflow-hidden",
    {
        variants: {
            size: {
                sm: "h-8 w-8 text-xs",
                default: "h-10 w-10 text-sm",
                lg: "h-12 w-12 text-base",
                xl: "h-16 w-16 text-lg",
            },
        },
        defaultVariants: {
            size: "default",
        },
    }
)

export interface AvatarProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
    src?: string | null
    name: string
}

function Avatar({ className, size, src, name, ...props }: AvatarProps) {
    const [imgError, setImgError] = React.useState(false)

    const showFallback = !src || imgError

    return (
        <div
            className={cn(
                avatarVariants({ size }),
                showFallback ? "bg-primary-100 text-primary-700" : "",
                className
            )}
            {...props}
        >
            {showFallback ? (
                <span>{getInitials(name)}</span>
            ) : (
                <img
                    src={src}
                    alt={name}
                    className="h-full w-full object-cover"
                    onError={() => setImgError(true)}
                />
            )}
        </div>
    )
}

export { Avatar, avatarVariants }
