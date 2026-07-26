import clsx from "clsx";
import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  strong?: boolean;
}

export default function Card({ strong, className, children, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        strong ? "glass-strong" : "glass",
        "rounded-3xl shadow-card p-5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
