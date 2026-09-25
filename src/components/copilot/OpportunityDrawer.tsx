import { useEffect, useState } from "react";
import {
  ArrowRight,
  Building2,
  Check,
  CircleAlert,
  Store,
  TrendingUp,
  Warehouse,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ConfidenceBadge, CoverPill, SignalBadge } from "@/components/copilot/primitives";
import { REVIEW_DAYS, storeById, type Opportunity } from "@/lib/copilot/engine";
import { useCopilot } from "@/lib/copilot/store";
import { cn } from "@/lib/utils";

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-2/60 p-3">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function DemandPulse({ prev, current }: { prev: number; current: number }) {
  const max = Math.max(prev, current, 1);
  return (
    <div className="rounded-xl border border-border bg-surface-2/60 p-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <p className="truncate text-sm font-medium">Demand pulse · weekly units</p>
        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-warning">
          <TrendingUp className="h-3.5 w-3.5" />
          {prev} → {current}
        </span>
      </div>
      <div className="mt-4 space-y-2">
        {[
          { label: "Previous 7 days", v: prev, cls: "bg-muted-foreground/40" },
          { label: "Recent 7 days", v: current, cls: "bg-primary" },
        ].map((b) => (
          <div key={b.label} className="grid grid-cols-[7rem_minmax(0,1fr)_2.5rem] items-center gap-2">
            <span className="truncate text-[11px] text-muted-foreground">{b.label}</span>
            <span className="h-2.5 overflow-hidden rounded-full bg-background/60">
              <span
                className={cn("block h-full rounded-full transition-all duration-500", b.cls)}
                style={{ width: `${(b.v / max) * 100}%` }}
              />
            </span>
            <span className="text-right text-xs font-semibold tabular-nums">{b.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SourceLadder({ selected }: { selected: "store" | "city" | "warehouse" | "exception" }) {
  const steps = [
    { key: "store", label: "Store", icon: Store },
    { key: "city", label: "City store", icon: Building2 },
    { key: "warehouse", label: "Warehouse", icon: Warehouse },
    { key: "exception", label: "Exception", icon: CircleAlert },
  ] as const;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium",
              s.key === selected
                ? "border-primary/50 bg-primary/20 text-primary-glow glow-ring"
                : "border-border bg-surface-2/60 text-muted-foreground",
            )}
          >
            <s.icon className="h-3.5 w-3.5" />
            {s.label}
          </span>
          {i < steps.length - 1 ? (
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60" />
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function OpportunityDrawer() {
  const { selected, select, execute, escalate, dismiss, statuses } = useCopilot();
  const [confirming, setConfirming] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!selected) {
      setConfirming(false);
      setSuccess(null);
    }
  }, [selected]);

  const open = Boolean(selected);
  const o = selected;
  const rec = o?.recommendation;
  const status = o ? (statuses[o.rowId] ?? "open") : "open";

  const ladder: "store" | "city" | "warehouse" | "exception" =
    rec?.kind === "transfer" || rec?.kind === "monitor"
      ? "city"
      : rec?.kind === "replenish"
        ? "warehouse"
        : rec?.kind === "constraint"
          ? "exception"
          : "store";

  const source = rec?.sourceStoreId ? storeById(rec.sourceStoreId) : null;
  const donor = o?.peers.find((p) => p.storeId === rec?.sourceStoreId);

  const runExecute = (opp: Opportunity) => {
    execute(opp);
    setConfirming(false);
    setSuccess(
      opp.recommendation.kind === "transfer"
        ? `${opp.recommendation.qty} units transferred · inventory recalculated`
        : `${opp.recommendation.qty} units replenished · inventory recalculated`,
    );
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => !v && select(null)}>
        <SheetContent
          side="right"
          className="w-full gap-0 overflow-y-auto border-border bg-popover p-0 sm:max-w-xl"
        >
          {o && rec ? (
            <>
              <SheetHeader className="border-b border-border bg-surface/80 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <SheetTitle className="text-xl">{o.product.name}</SheetTitle>
                  <span className="rounded-md border border-border bg-surface-2 px-2 py-0.5 text-xs text-muted-foreground">
                    {o.product.id}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {o.category} · {o.storeName}, Bangalore
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {o.signals.map((s) => (
                    <SignalBadge key={s} signal={s} />
                  ))}
                </div>
              </SheetHeader>

              <div className="space-y-5 p-5">
                {success ? (
                  <div className="flex items-center gap-3 rounded-xl border border-success/40 bg-success/10 p-4 text-sm font-medium text-success">
                    <Check className="h-4 w-4 shrink-0" />
                    {success}
                  </div>
                ) : null}

                <DemandPulse
                  prev={Math.round(o.metrics.prevDaily * 7)}
                  current={o.metrics.expectedDemand}
                />

                <div>
                  <p className="pb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Inventory position
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <Stat
                      label={`${o.storeName} stock`}
                      value={`${o.stock}`}
                      hint={o.inTransit ? `${o.inTransit} in transit` : "no in-transit units"}
                    />
                    <Stat
                      label="Days of cover"
                      value={`${o.metrics.cover.toFixed(1)}d`}
                      hint={`risk below 4d`}
                    />
                    <Stat
                      label={`Expected demand (${REVIEW_DAYS}d)`}
                      value={`${o.metrics.expectedDemand}`}
                      hint={`${o.metrics.recentDaily}/day`}
                    />
                    <Stat
                      label={donor ? `${donor.storeName} stock` : "Best city peer"}
                      value={donor ? `${donor.stock}` : `${o.peers[0]?.stock ?? 0}`}
                      hint={
                        donor
                          ? `${donor.cover.toFixed(1)}d cover · ${donor.surplus} transferable`
                          : `${(o.peers[0]?.cover ?? 0).toFixed(1)}d cover · ${o.peers[0]?.surplus ?? 0} transferable`
                      }
                    />
                    <Stat
                      label="Warehouse available"
                      value={`${o.warehouseStock}`}
                      hint="Bangalore DC"
                    />
                    {rec.sourceCoverAfter !== undefined ? (
                      <Stat
                        label="Source cover after"
                        value={`${rec.sourceCoverAfter.toFixed(1)}d`}
                        hint="stays above 7d target"
                      />
                    ) : (
                      <Stat
                        label="Cover after action"
                        value={`${rec.coverAfter.toFixed(1)}d`}
                        hint="projected"
                      />
                    )}
                  </div>
                </div>

                <div
                  className={cn(
                    "rounded-2xl border p-5",
                    rec.kind === "constraint"
                      ? "border-destructive/40 bg-destructive/10"
                      : rec.kind === "none"
                        ? "border-border bg-surface-2/60"
                        : "border-primary/40 bg-primary/12 glow-ring",
                  )}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Recommended action
                  </p>
                  {rec.kind === "transfer" && source ? (
                    <>
                      <p className="mt-2 text-2xl font-semibold">TRANSFER {rec.qty} UNITS</p>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        {source.name} <ArrowRight className="h-4 w-4" /> {o.storeName}
                      </p>
                    </>
                  ) : rec.kind === "monitor" && source ? (
                    <>
                      <p className="mt-2 text-2xl font-semibold">MONITOR · POTENTIAL REBALANCE</p>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        Up to {rec.qty} units {source.name} <ArrowRight className="h-4 w-4" /> {o.storeName} if the surge continues
                      </p>
                    </>
                  ) : rec.kind === "replenish" ? (
                    <>
                      <p className="mt-2 text-2xl font-semibold">REPLENISH {rec.qty} UNITS</p>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        Warehouse <ArrowRight className="h-4 w-4" /> {o.storeName}
                      </p>
                    </>
                  ) : rec.kind === "constraint" ? (
                    <>
                      <p className="mt-2 text-2xl font-semibold text-destructive">
                        SUPPLY CONSTRAINT DETECTED
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Demand exists, but inventory is unavailable across the current network.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="mt-2 text-2xl font-semibold">NO ACTION</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Inventory is already positioned where demand is expected.
                      </p>
                    </>
                  )}

                  <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Why?
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {rec.reasons.map((r) => (
                      <li key={r} className="flex gap-2 text-sm text-foreground/90">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-glow" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Source decision
                  </p>
                  <SourceLadder selected={ladder} />
                  <div className="flex flex-wrap items-center gap-2">
                    <ConfidenceBadge value={rec.confidence} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground/80">Alternative considered: </span>
                    {rec.alternative}
                  </p>
                </div>
              </div>

              <div className="sticky bottom-0 flex flex-wrap gap-2 border-t border-border bg-surface/95 p-4 backdrop-blur">
                {status !== "open" ? (
                  <p className="flex-1 text-sm text-muted-foreground">
                    This recommendation is <span className="font-semibold capitalize">{status}</span>.
                  </p>
                ) : rec.kind === "transfer" ? (
                  <Button className="flex-1" onClick={() => setConfirming(true)}>
                    Execute Transfer
                  </Button>
                ) : rec.kind === "replenish" ? (
                  <Button className="flex-1" onClick={() => setConfirming(true)}>
                    Execute Warehouse Replenishment
                  </Button>
                ) : rec.kind === "monitor" ? (
                  <Button variant="secondary" className="flex-1" onClick={() => dismiss(o)}>
                    Acknowledge · keep monitoring
                  </Button>
                ) : rec.kind === "constraint" ? (
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      escalate(o);
                      setSuccess("Supply constraint escalated to the planning team");
                    }}
                  >
                    Escalate / Flag
                  </Button>
                ) : null}
                {status === "open" && rec.kind !== "none" && rec.kind !== "monitor" ? (
                  <Button variant="ghost" onClick={() => dismiss(o)}>
                    Dismiss
                  </Button>
                ) : null}
                <Button variant="ghost" onClick={() => select(null)}>
                  Close
                </Button>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent className="border-border bg-popover sm:max-w-md">
          {o && rec ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {rec.kind === "transfer" ? "Confirm inventory transfer" : "Confirm warehouse replenishment"}
                </DialogTitle>
                <DialogDescription>
                  {rec.qty} units ·{" "}
                  {rec.kind === "transfer" && source ? source.name : "Warehouse"} → {o.storeName}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 rounded-xl border border-border bg-surface-2/60 p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{o.storeName} cover</span>
                  <span className="font-semibold tabular-nums">
                    {o.metrics.cover.toFixed(1)} → {rec.coverAfter.toFixed(1)} days
                  </span>
                </div>
                {rec.kind === "transfer" && donor ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">{donor.storeName} cover</span>
                    <span className="font-semibold tabular-nums">
                      {donor.cover.toFixed(1)} → {rec.sourceCoverAfter?.toFixed(1)} days
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Warehouse on hand</span>
                    <span className="font-semibold tabular-nums">
                      {o.warehouseStock} → {o.warehouseStock - rec.qty}
                    </span>
                  </div>
                )}
                <div className="pt-1">
                  {rec.kind === "transfer" ? (
                    <span className="rounded-md border border-success/30 bg-success/15 px-2 py-1 text-xs font-semibold text-success">
                      Warehouse pull avoided
                    </span>
                  ) : (
                    <span className="rounded-md border border-info/30 bg-info/15 px-2 py-1 text-xs font-semibold text-info">
                      Expected arrival: 2 days · status In Transit
                    </span>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setConfirming(false)}>
                  Cancel
                </Button>
                <Button onClick={() => runExecute(o)}>Confirm &amp; Execute</Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
