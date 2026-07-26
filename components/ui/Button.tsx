"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg";

interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary-gradient text-white shadow-glow-sm hover:shadow-glow active:scale-[0.98]",
  secondary:
    "glass text-white hover:bg-white/10 active:scale-[0.98]",
  ghost: "text-white/70 hover:text-white hover:bg-white/5 active:scale-[0.98]",
  danger: "bg-red-500/90 text-white hover:bg-red-500 active:scale-[0.98]",
};

const sizeClasses: Record<Size, string> = {
  md: "h-12 px-5 text-[15px] rounded-2xl gap-2",
  lg: "h-14 px-7 text-base rounded-2xl gap-2.5",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "lg", loading, icon, fullWidth, className, children, disabled, ...props },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        className={clsx(
          "relative inline-flex items-center justify-center font-semibold tracking-tight transition-all duration-200 select-none disabled:opacity-50 disabled:pointer-events-none",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className
        )}
        disabled={disabled || loading}
        {...(props as HTMLMotionProps<"button">)}
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          icon
        )}
        {children}
      </motion.button>
    );
  }
);
Button.displayName = "Button";

export default Button;
