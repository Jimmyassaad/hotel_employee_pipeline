import { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
}

export function Card({ children, className = "", as: Component = "div" }: CardProps) {
  return (
    <Component
      className={`bg-transparent border border-border p-5 ${className}`}
    >
      {children}
    </Component>
  );
}
