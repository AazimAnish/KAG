import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-candal transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D98324] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#D98324] text-[#F2F6D0] hover:bg-[#D98324]/90",
        destructive: "bg-red-500 text-[#F2F6D0] hover:bg-red-500/90",
        outline: "border border-[#D98324] bg-transparent hover:bg-[#D98324]/10 text-[#443627] dark:text-[#EFDCAB]",
        secondary: "bg-[#EFDCAB] text-[#443627] hover:bg-[#EFDCAB]/80",
        ghost: "hover:bg-[#D98324]/10 text-[#443627] dark:text-[#EFDCAB]",
        link: "text-[#D98324] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
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
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
