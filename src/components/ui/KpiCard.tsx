interface KpiCardProps {
  label: string;
  value: string | number;
  subline?: string;
  accent?: boolean;
}

export function KpiCard({ label, value, subline, accent }: KpiCardProps) {
  return (
    <div className="border-b-2 border-border pb-6">
      <p className="font-mono text-stat-label text-primary-muted uppercase">
        {label}
      </p>
      <p
        className={`mt-2 text-kpi font-serif ${accent ? "text-accent" : "text-primary"}`}
      >
        {value}
      </p>
      {subline != null && subline !== "" && (
        <p className="mt-1 font-mono text-body-sm text-primary-muted">{subline}</p>
      )}
    </div>
  );
}
