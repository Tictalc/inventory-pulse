import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import {
  historicalRecs,
  initialRows,
  initialWarehouse,
  seedTransfers,
  type InventoryRow,
  type TransferRecord,
} from "./data";
import {
  buildAll,
  interventionTier,
  rightPlaceStats,
  sortOpportunities,
  storeById,
  type ActionKind,
  type Confidence,
  type Opportunity,
} from "./engine";

export type ActivityItem = {
  id: string;
  kind: "transfer" | "replenish" | "escalate" | "dismiss";
  title: string;
  detail: string;
  at: string;
  rowId?: string;
  recKind?: ActionKind;
  confidence?: Confidence;
};

export type Status = "open" | "resolved" | "escalated" | "dismissed";

type Ctx = {
  opportunities: Opportunity[];
  priority: Opportunity[];
  statuses: Record<string, Status>;
  activity: ActivityItem[];
  warehouse: Record<string, number>;
  avoidedPulls: number;
  transfers: TransferRecord[];
  intervention: { auto: number; assisted: number; manual: number; total: number; rate: number };
  metrics: { rightPlace: number; avoidedPulls: number; interventionRate: number };
  selected: Opportunity | null;
  select: (rowId: string | null) => void;
  execute: (opp: Opportunity) => void;
  escalate: (opp: Opportunity) => void;
  dismiss: (opp: Opportunity) => void;
  reset: () => void;
};

const CopilotContext = createContext<Ctx | null>(null);

const now = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export function CopilotProvider({ children }: { children: ReactNode }) {
  const [rows, setRows] = useState<InventoryRow[]>(initialRows);
  const [warehouse, setWarehouse] = useState<Record<string, number>>(initialWarehouse);
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [transfers, setTransfers] = useState<TransferRecord[]>(seedTransfers);
  const avoidedPulls = transfers.length;

  const opportunities = useMemo(() => buildAll(rows, warehouse), [rows, warehouse]);
  const priority = useMemo(
    () =>
      sortOpportunities(
        opportunities.filter(
          (o) => o.recommendation.kind !== "none" && (statuses[o.rowId] ?? "open") === "open",
        ),
      ),
    [opportunities, statuses],
  );

  const selected = useMemo(
    () => opportunities.find((o) => o.rowId === selectedId) ?? null,
    [opportunities, selectedId],
  );

  const log = useCallback((item: Omit<ActivityItem, "id" | "at">) => {
    setActivity((prev) => [
      { ...item, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, at: now() },
      ...prev,
    ]);
  }, []);

  const execute = useCallback(
    (opp: Opportunity) => {
      const { recommendation: rec } = opp;
      if (rec.kind === "transfer" && rec.sourceStoreId) {
        setRows((prev) =>
          prev.map((r) => {
            if (r.productId === opp.product.id && r.storeId === opp.storeId)
              return { ...r, stock: r.stock + rec.qty };
            if (r.productId === opp.product.id && r.storeId === rec.sourceStoreId)
              return { ...r, stock: r.stock - rec.qty };
            return r;
          }),
        );
        setTransfers((prev) => [
          {
            id: `live-${Date.now()}`,
            productName: opp.product.name,
            sourceStore: storeById(rec.sourceStoreId!).name,
            destStore: opp.storeName,
            units: rec.qty,
            when: `Today ${now()} · just executed`,
            coverBefore: opp.metrics.cover,
            coverAfter: rec.coverAfter,
            live: true,
          },
          ...prev,
        ]);
        log({
          rowId: opp.rowId,
          recKind: rec.kind,
          confidence: rec.confidence,
          kind: "transfer",
          title: `${rec.qty} units transferred`,
          detail: `${storeById(rec.sourceStoreId).name} → ${opp.storeName} · ${opp.product.name}`,
        });
      } else if (rec.kind === "replenish") {
        setRows((prev) =>
          prev.map((r) =>
            r.productId === opp.product.id && r.storeId === opp.storeId
              ? { ...r, stock: r.stock + rec.qty }
              : r,
          ),
        );
        setWarehouse((prev) => ({
          ...prev,
          [opp.product.id]: Math.max(0, (prev[opp.product.id] ?? 0) - rec.qty),
        }));
        log({
          rowId: opp.rowId,
          recKind: rec.kind,
          confidence: rec.confidence,
          kind: "replenish",
          title: `${rec.qty} units replenished`,
          detail: `Warehouse → ${opp.storeName} · ${opp.product.name}`,
        });
      }
      setStatuses((prev) => ({ ...prev, [opp.rowId]: "resolved" }));
    },
    [log],
  );

  const escalate = useCallback(
    (opp: Opportunity) => {
      setStatuses((prev) => ({ ...prev, [opp.rowId]: "escalated" }));
      log({
        rowId: opp.rowId,
        recKind: opp.recommendation.kind,
        confidence: opp.recommendation.confidence,
        kind: "escalate",
        title: "Supply constraint flagged",
        detail: `${opp.product.name} · ${opp.storeName}`,
      });
    },
    [log],
  );

  const dismiss = useCallback(
    (opp: Opportunity) => {
      setStatuses((prev) => ({ ...prev, [opp.rowId]: "dismissed" }));
      log({
        kind: "dismiss",
        title: "Recommendation dismissed",
        detail: `${opp.product.name} · ${opp.storeName}`,
      });
    },
    [log],
  );

  const reset = useCallback(() => {
    setRows(initialRows);
    setWarehouse(initialWarehouse);
    setStatuses({});
    setActivity([]);
    setTransfers(seedTransfers);
    setSelectedId(null);
  }, []);

  const intervention = useMemo(() => {
    const c = { ...historicalRecs };
    for (const o of priority) c[interventionTier(o.recommendation.kind, o.recommendation.confidence)]++;
    for (const a of activity)
      if (a.recKind && a.confidence && a.kind !== "dismiss") c[interventionTier(a.recKind, a.confidence)]++;
    const total = c.auto + c.assisted + c.manual;
    return { ...c, total, rate: Math.round(((c.assisted + c.manual) / total) * 100) };
  }, [priority, activity]);

  const metrics = useMemo(
    () => ({
      rightPlace: rightPlaceStats(opportunities).pct,
      avoidedPulls,
      interventionRate: intervention.rate,
    }),
    [opportunities, avoidedPulls, intervention],
  );

  const value: Ctx = {
    opportunities,
    priority,
    statuses,
    activity,
    warehouse,
    avoidedPulls,
    transfers,
    intervention,
    metrics,
    selected,
    select: setSelectedId,
    execute,
    escalate,
    dismiss,
    reset,
  };

  return <CopilotContext.Provider value={value}>{children}</CopilotContext.Provider>;
}

export function useCopilot() {
  const ctx = useContext(CopilotContext);
  if (!ctx) throw new Error("useCopilot must be used inside CopilotProvider");
  return ctx;
}
