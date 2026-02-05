import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

// Simplified version of shadcn/ui button (without radix slot dependency if possible, but I'll use simple HTML button for now to avoid installing radix if not needed, wait, I can just use standard props)
// Actually I will skip Radix for now to keep it lightweight as requested, unless I really need it.
// I'll implementation a simple Button component.

const buttonVariants = cva(
    "inline-flex items-center justify-center rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
    {
        variants: {
            variant: {
                default: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md",
                destructive: "bg-red-500 text-white hover:bg-red-600",
                outline: "border border-slate-200 hover:bg-slate-100 hover:text-slate-900",
                secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
                ghost: "hover:bg-slate-100 hover:text-slate-900",
                link: "underline-offset-4 hover:underline text-indigo-600",
            },
            size: {
                default: "h-10 py-2 px-4",
                sm: "h-9 px-3 rounded-lg",
                lg: "h-11 px-8 rounded-xl text-md",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        return (
            <button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
