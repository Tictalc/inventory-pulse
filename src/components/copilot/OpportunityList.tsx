import { ArrowRight, Ban, MoveRight, Warehouse } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CoverPill, SignalBadge } from "@/components/copilot/primitives";
import { storeById, type Opportunity } from "@/lib/copilot/engine";
import { useCopilot, type Status } from "@/lib/copilot/store";
import { cn } from "@/lib/utils";

export function actionLabel(o: Opportunity) {
  const r = o.recommendation;
  if (r.kind === "transfer" && r.sourceStoreId)
    return `Transfer ${r.qty} from ${storeById(r.sourceStoreId).name}`;
  if (r.kind === "replenish") return `Replenish ${r.qty} from Warehouse`;
  if (r.kind === "constraint") return "Escalate — supply constraint";
  if (r.kind === "monitor" && r.sourceStoreId)
    return `Monitor · rebalance up to ${r.qty} from ${storeById(r.sourceStoreId).name}`;
  return "No action needed";
}

function ActionIcon({ o }: { o: Opportunity }) {
  const k = o.recommendation.kind;
  const Icon = k === "transfer" || k === "monitor" ? MoveRight : k === "replenish" ? Warehouse : Ban;
  return (
    <Icon
      className={cn(
        "h-4 w-4 shrink-0",
        k === "transfer" && "text-primary-glow",
        k === "monitor" && "text-warning",
        k === "replenish" && "text-info",
        k === "constraint" && "text-destructive",
        k === "none" && "text-muted-foreground",
      )}
    />
  );
}

function StatusChip({ status }: { status: Status }) {
  if (status === "open") return null;
  const map: Record<string, string> = {
    resolved: "bg-success/15 text-success border-success/30",
    escalated: "bg-warning/15 text-warning border-warning/30",
    dismissed: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={cn("rounded-md border px-2 py-0.5 text-[11px] font-semibold capitalize", map[status])}>
      {status}
    </span>
  );
}

export function OpportunityList({
  items,
  emptyText = "Nothing open — the network is balanced.",
}: {
  items: Opportunity[];
  emptyText?: string;
}) {
  const { select, statuses } = useCopilot();

  if (items.length === 0) {
    return (
      <div className="panel p-8 text-center text-sm text-muted-foreground">{emptyText}</div>
    );
  }

  return (
    <div className="panel divide-y divide-border overflow-hidden">
      <div className="hidden grid-cols-[1.5fr_0.7fr_0.9fr_11.5rem_3.5rem_1.5fr] gap-4 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground lg:grid">
        <span>SKU</span>
        <span>Category</span>
        <span>Store</span>
        <span>Signal</span>
        <span>Cover</span>
        <span>Recommended action</span>
      </div>
      {items.map((o) => {
        const status = statuses[o.rowId] ?? "open";
        return (
          <button
            key={o.rowId}
            onClick={() => select(o.rowId)}
            className="group block w-full px-4 py-4 text-left transition-colors hover:bg-surface-2 sm:px-5 lg:grid lg:grid-cols-[1.5fr_0.7fr_0.9fr_11.5rem_3.5rem_1.5fr] lg:items-center lg:gap-4"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{o.product.name}</p>
              <p className="truncate text-xs text-muted-foreground">{o.product.id}</p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground lg:mt-0 lg:text-sm">{o.category}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground lg:mt-0 lg:text-sm lg:text-foreground">
              {o.storeName}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 lg:mt-0">
              <SignalBadge signal={o.primarySignal} />
              <span className="lg:hidden">
                <CoverPill cover={o.metrics.cover} />
              </span>
            </div>
            <div className="hidden lg:block">
              <CoverPill cover={o.metrics.cover} />
            </div>
            <div className="mt-3 flex items-center gap-2 lg:mt-0">
              <ActionIcon o={o} />
              <span className="min-w-0 flex-1 truncate text-xs font-medium lg:text-sm">
                {actionLabel(o)}
              </span>
              <StatusChip status={status} />
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function ScopeNote() {
  return (
    <Button variant="ghost" size="sm" className="pointer-events-none text-xs text-muted-foreground">
      Prototype decision rules · not production ML
    </Button>
  );
}
