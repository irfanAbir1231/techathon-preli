import type { HTMLAttributes, ReactNode } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const GlassCard = ({ children, className = "", ...props }: GlassCardProps) => (
  <div className={`glass-card ${className}`.trim()} {...props}>
    {children}
  </div>
);
