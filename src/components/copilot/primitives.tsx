import {
  AlertTriangle,
  Flame,
  Scale,
  ShieldCheck,
  Warehouse,
  Ban,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { SIGNAL_LABEL, type Confidence, type SignalKind } from "@/lib/copilot/engine";

const SIGNAL_STYLE: Record<SignalKind, { icon: LucideIcon; cls: string }> = {
  demand_surge: { icon: Flame, cls: "bg-warning/15 text-warning border-warning/30" },
  stockout_risk: { icon: AlertTriangle, cls: "bg-destructive/15 text-destructive border-destructive/30" },
  network_imbalance: { icon: Scale, cls: "bg-primary/20 text-primary-glow border-primary/40" },
  warehouse_dependency: { icon: Warehouse, cls: "bg-info/15 text-info border-info/30" },
  supply_constraint: { icon: Ban, cls: "bg-destructive/20 text-destructive border-destructive/40" },
  healthy: { icon: ShieldCheck, cls: "bg-success/15 text-success border-success/30" },
};

export function SignalBadge({ signal, className }: { signal: SignalKind; className?: string }) {
  const { icon: Icon, cls } = SIGNAL_STYLE[signal];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        cls,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {SIGNAL_LABEL[signal]}
    </span>
  );
}

export function CoverPill({ cover }: { cover: number }) {
  const tone =
    cover < 2.5
      ? "bg-destructive/15 text-destructive border-destructive/30"
      : cover < 4
        ? "bg-warning/15 text-warning border-warning/30"
        : "bg-success/15 text-success border-success/30";
  return (
    <span className={cn("inline-flex rounded-md border px-2 py-0.5 text-xs font-semibold tabular-nums", tone)}>
      {cover.toFixed(1)}d
    </span>
  );
}

export function ConfidenceBadge({ value }: { value: Confidence }) {
  const tone =
    value === "High"
      ? "bg-success/15 text-success border-success/30"
      : value === "Medium"
        ? "bg-warning/15 text-warning border-warning/30"
        : "bg-muted text-muted-foreground border-border";
  return (
    <span className={cn("rounded-md border px-2 py-0.5 text-xs font-semibold", tone)}>
      {value} · prototype confidence
    </span>
  );
}

export function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: LucideIcon;
  accent?: "primary" | "warning" | "success" | "destructive";
}) {
  const ring = {
    primary: "text-primary-glow bg-primary/15",
    warning: "text-warning bg-warning/15",
    success: "text-success bg-success/15",
    destructive: "text-destructive bg-destructive/15",
  }[accent ?? "primary"];

  return (
    <div className="panel relative overflow-hidden p-4 sm:p-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
        </div>
        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", ring)}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

export function SectionTitle({
  title,
  hint,
  right,
}: {
  title: string;
  hint?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 pb-3">
      <div className="min-w-0">
        <h2 className="truncate text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </h2>
        {hint ? <p className="mt-1 text-xs text-muted-foreground/80">{hint}</p> : null}
      </div>
      {right}
    </div>
  );
}

export function DemoTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary-glow",
        className,
      )}
    >
      Synthetic demo data
    </span>
  );
}
