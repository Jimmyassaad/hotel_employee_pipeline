import { type ReactNode } from "react";

interface SectionHeaderProps {
  title: React.ReactNode;
  description?: string;
  action?: ReactNode;
}

export function SectionHeader({
  title,
  description,
  action,
}: SectionHeaderProps) {
  return (
    <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {description != null && description !== "" && (
          <p className="font-mono text-section-label text-primary-muted uppercase mb-3">
            {description}
          </p>
        )}
        <h2 className="font-serif text-h2 text-primary">{title}</h2>
      </div>
      {action != null && <div className="shrink-0">{action}</div>}
    </div>
  );
}
