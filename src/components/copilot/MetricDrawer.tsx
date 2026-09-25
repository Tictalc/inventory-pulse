import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

import { CoverPill, SignalBadge } from "@/components/copilot/primitives";
import { actionLabel } from "@/components/copilot/OpportunityList";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { rightPlaceStats, storeById, type Opportunity } from "@/lib/copilot/engine";
import { useCopilot } from "@/lib/copilot/store";
import { cn } from "@/lib/utils";

export type MetricKey =
  | "risk"
  | "signals"
  | "network"
  | "avoided"
  | "rightPlace"
  | "intervention";

const META: Record<MetricKey, { title: string; def: string }> = {
  risk: {
    title: "Best Sellers at Risk",
    def: "SKU-store pairs with fewer than 4 days of cover at current demand velocity.",
  },
  signals: {
    title: "Active Demand Signals",
    def: "Best-seller SKU-store pairs where recent 7-day velocity is at least 25% above the previous 7 days.",
  },
  network: {
    title: "Network Opportunities",
    def: "Open recommendations where inventory can be rebalanced, replenished, or needs a supply decision.",
  },
  avoided: {
    title: "Avoided Warehouse Pulls",
    def: "Completed actions satisfied through existing city inventory instead of pulling from the warehouse.",
  },
  rightPlace: {
    title: "Right-Place Inventory",
    def: "Share of tracked best-seller units within 14 days of their local expected demand, net of unmet 7-day shortfall. Prototype metric on synthetic data — not a Lenskart KPI.",
  },
  intervention: {
    title: "Human Intervention",
    def: "Share of recommendations requiring manual action rather than being auto-resolvable. Deterministic prototype rules, not an ML confidence model.",
  },
};

function Row({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-xl border border-border bg-surface-2/50 p-3 text-left transition-colors hover:border-primary/40 hover:bg-surface-2"
    >
      <div className="min-w-0 flex-1">{children}</div>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

function Head({ o }: { o: Opportunity }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      <p className="text-sm font-semibold">{o.product.name}</p>
      <p className="text-xs text-muted-foreground">
        {o.category} · {o.storeName}
      </p>
    </div>
  );
}

function Kv({ k, v }: { k: string; v: ReactNode }) {
  return (
    <span className="text-xs text-muted-foreground">
      {k} <span className="font-semibold text-foreground tabular-nums">{v}</span>
    </span>
  );
}

function Group({ title, children, empty }: { title: string; children: ReactNode[]; empty: string }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {title} · {children.length}
      </p>
      {children.length ? children : <p className="text-xs text-muted-foreground">{empty}</p>}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-2/50 p-3">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-xl font-semibold tabular-nums", tone)}>{value}</p>
    </div>
  );
}

export function MetricDrawer({ metric, onClose }: { metric: MetricKey | null; onClose: () => void }) {
  const { opportunities, statuses, transfers, intervention, select, warehouse } = useCopilot();
  const open = (o: Opportunity) => {
    onClose();
    select(o.rowId);
  };

  const cityAvail = (o: Opportunity) => o.peers.reduce((a, p) => a + p.surplus, 0);

  let body: ReactNode = null;
  if (metric === "risk") {
    const list = opportunities.filter((o) => o.metrics.cover < 4).sort((a, b) => a.metrics.cover - b.metrics.cover);
    body = (
      <div className="space-y-2">
        {list.length === 0 ? <p className="text-sm text-muted-foreground">No best sellers at risk.</p> : null}
        {list.map((o) => (
          <Row key={o.rowId} onClick={() => open(o)}>
            <Head o={o} />
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
              <Kv k="Stock" v={o.stock} />
              <CoverPill cover={o.metrics.cover} />
              <SignalBadge signal={o.primarySignal} />
            </div>
            <p className="mt-2 text-xs font-medium text-primary-glow">{actionLabel(o)}</p>
          </Row>
        ))}
      </div>
    );
  } else if (metric === "signals") {
    const list = opportunities.filter((o) => o.signals.includes("demand_surge"));
    body = (
      <div className="space-y-2">
        {list.length === 0 ? <p className="text-sm text-muted-foreground">No active demand signals.</p> : null}
        {list.map((o) => (
          <Row key={o.rowId} onClick={() => open(o)}>
            <Head o={o} />
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
              <Kv k="Previous" v={`${o.metrics.prevDaily}/day`} />
              <Kv k="Current" v={`${o.metrics.recentDaily}/day`} />
              <Kv k="Change" v={<span className="text-warning">+{Math.round((o.metrics.accel - 1) * 100)}%</span>} />
              <CoverPill cover={o.metrics.cover} />
              <SignalBadge signal="demand_surge" />
            </div>
          </Row>
        ))}
      </div>
    );
  } else if (metric === "network") {
    const list = opportunities.filter((o) => {
      const st = statuses[o.rowId] ?? "open";
      return o.recommendation.kind !== "none" && (st === "open" || st === "escalated");
    });
    const by = (k: string) => list.filter((o) => o.recommendation.kind === k);
    body = (
      <div className="space-y-6">
        <Group title="City transfer" empty="No open city transfers.">
          {[...by("transfer"), ...by("monitor")].map((o) => {
            const src = o.peers.find((p) => p.storeId === o.recommendation.sourceStoreId);
            return (
              <Row key={o.rowId} onClick={() => open(o)}>
                <Head o={o} />
                <p className="mt-1 text-xs">
                  {src?.storeName} → {o.storeName} · <span className="font-semibold">{o.recommendation.qty} units</span>
                  {o.recommendation.kind === "monitor" ? <span className="text-warning"> · monitor, not urgent</span> : null}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  <Kv k="Destination cover" v={`${o.metrics.cover.toFixed(1)}d`} />
                  <Kv k="Source cover" v={`${src?.cover.toFixed(1)}d`} />
                </div>
              </Row>
            );
          })}
        </Group>
        <Group title="Warehouse replenishment" empty="No open warehouse replenishments.">
          {by("replenish").map((o) => (
            <Row key={o.rowId} onClick={() => open(o)}>
              <Head o={o} />
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                <Kv k="Quantity" v={o.recommendation.qty} />
                <Kv k="Warehouse" v={warehouse[o.product.id] ?? 0} />
                <Kv k="Destination cover" v={`${o.metrics.cover.toFixed(1)}d`} />
              </div>
            </Row>
          ))}
        </Group>
        <Group title="Supply constraint" empty="No supply constraints.">
          {by("constraint").map((o) => (
            <Row key={o.rowId} onClick={() => open(o)}>
              <Head o={o} />
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                <Kv k="Current cover" v={`${o.metrics.cover.toFixed(1)}d`} />
                <Kv k="City available" v={cityAvail(o)} />
                <Kv k="Warehouse" v={o.warehouseStock} />
                {(statuses[o.rowId] ?? "open") === "escalated" ? (
                  <span className="text-xs font-semibold text-warning">Escalated</span>
                ) : null}
              </div>
            </Row>
          ))}
        </Group>
      </div>
    );
  } else if (metric === "avoided") {
    const units = transfers.reduce((a, t) => a + t.units, 0);
    body = (
      <div className="space-y-2">
        {transfers.map((t) => (
          <div
            key={t.id}
            className={cn(
              "rounded-xl border p-3",
              t.live ? "border-success/40 bg-success/10" : "border-border bg-surface-2/50",
            )}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-semibold">{t.productName}</p>
              <p className={cn("text-xs", t.live ? "text-success" : "text-muted-foreground")}>{t.when}</p>
            </div>
            <p className="mt-1 text-xs">
              {t.sourceStore} → {t.destStore} · <span className="font-semibold">{t.units} units</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Destination cover{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {t.coverBefore.toFixed(1)}d → {t.coverAfter.toFixed(1)}d
              </span>
            </p>
          </div>
        ))}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Stat label="Total warehouse pulls avoided" value={transfers.length} tone="text-success" />
          <Stat label="Units fulfilled through city inventory" value={units} />
        </div>
      </div>
    );
  } else if (metric === "rightPlace") {
    const s = rightPlaceStats(opportunities);
    const top = opportunities
      .filter((o) => {
        const st = statuses[o.rowId] ?? "open";
        return (o.recommendation.kind === "transfer" || o.recommendation.kind === "monitor") && st === "open";
      })
      .sort((a, b) => a.metrics.cover - b.metrics.cover);
    body = (
      <div className="space-y-5">
        <div>
          <p className="text-3xl font-semibold tabular-nums">{s.pct}%</p>
          <p className="text-xs text-muted-foreground">
            {s.aligned.toLocaleString()} / {(s.total + s.shortfall).toLocaleString()} units aligned with expected demand
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Tracked units" value={s.total} />
          <Stat label="Right-place" value={s.aligned} tone="text-success" />
          <Stat label="Excess (>14d)" value={s.excess} tone="text-warning" />
          <Stat label="Unmet shortfall" value={s.shortfall} tone="text-destructive" />
        </div>
        <Group title="Top rebalancing opportunities" empty="No open rebalancing opportunities.">
          {top.map((o) => (
            <Row key={o.rowId} onClick={() => open(o)}>
              <Head o={o} />
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                <Kv k="Current location" v={storeById(o.recommendation.sourceStoreId!).name} />
                <Kv k="Demand location" v={o.storeName} />
                <Kv k="Cover" v={`${o.metrics.cover.toFixed(1)}d`} />
                <Kv k="Expected demand" v={o.metrics.expectedDemand} />
                <Kv k="Suggested" v={`${o.recommendation.qty} units`} />
              </div>
            </Row>
          ))}
        </Group>
      </div>
    );
  } else if (metric === "intervention") {
    const i = intervention;
    const openList = opportunities.filter(
      (o) => o.recommendation.kind !== "none" && (statuses[o.rowId] ?? "open") === "open",
    );
    body = (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Total recommendations" value={i.total} />
          <Stat label="Resolved automatically" value={i.auto} tone="text-success" />
          <Stat label="Requiring human action" value={i.assisted + i.manual} tone="text-warning" />
          <Stat label="Intervention rate" value={`${i.rate}%`} />
        </div>
        <div className="space-y-2 text-xs">
          {[
            { k: "Auto-resolvable", n: i.auto, d: "High-confidence warehouse replenishment within standard flow" },
            { k: "Assisted", n: i.assisted, d: "Inter-store transfers, monitors and partial fills — one-click approval" },
            { k: "Manual / Escalated", n: i.manual, d: "Supply constraints needing a planning decision" },
          ].map((r) => (
            <div key={r.k} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2/50 p-3">
              <div>
                <p className="font-semibold uppercase tracking-wider">{r.k}</p>
                <p className="text-muted-foreground">{r.d}</p>
              </div>
              <p className="text-lg font-semibold tabular-nums">{r.n}</p>
            </div>
          ))}
          <p className="text-muted-foreground">Includes a synthetic baseline of historical recommendations.</p>
        </div>
        <Group title="Open recommendations" empty="No open recommendations.">
          {openList.map((o) => (
            <Row key={o.rowId} onClick={() => open(o)}>
              <Head o={o} />
              <p className="mt-1 text-xs text-primary-glow">{actionLabel(o)}</p>
            </Row>
          ))}
        </Group>
      </div>
    );
  }

  return (
    <Sheet open={metric !== null} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto border-border bg-popover p-0 sm:max-w-xl">
        {metric ? (
          <>
            <SheetHeader className="border-b border-border bg-surface/80 p-5">
              <SheetTitle className="text-lg uppercase tracking-[0.12em]">{META[metric].title}</SheetTitle>
              <SheetDescription>{META[metric].def}</SheetDescription>
            </SheetHeader>
            <div className="p-5">{body}</div>
            <p className="px-5 pb-5 text-[11px] text-muted-foreground">
              Synthetic demo data · prototype decision rules, not production ML.
            </p>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
