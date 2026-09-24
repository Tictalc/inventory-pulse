// Transparent, explainable prototype decision rules (NOT a trained ML model).

import {
  type Category,
  type InventoryRow,
  type Product,
  products,
  stores,
} from "./data";

export const REVIEW_DAYS = 7; // replenishment review period
export const RISK_COVER = 4; // days of cover considered "at risk"
export const DONOR_KEEP_DAYS = 7; // cover a donor store must retain
export const MIN_TRANSFER = 5; // don't move trivially small quantities
export const SURGE_RATIO = 1.25;

export type SignalKind =
  | "demand_surge"
  | "stockout_risk"
  | "network_imbalance"
  | "warehouse_dependency"
  | "supply_constraint"
  | "healthy";

export type ActionKind = "transfer" | "replenish" | "none" | "constraint";

export type Confidence = "High" | "Medium" | "Low";

export type Metrics = {
  recentDaily: number;
  prevDaily: number;
  accel: number;
  cover: number;
  expectedDemand: number;
};

export type Recommendation = {
  kind: ActionKind;
  qty: number;
  sourceStoreId?: string;
  reasons: string[];
  confidence: Confidence;
  alternative: string;
  coverAfter: number;
  sourceCoverAfter?: number;
};

export type Opportunity = {
  rowId: string;
  product: Product;
  storeId: string;
  storeName: string;
  category: Category;
  stock: number;
  inTransit: number;
  metrics: Metrics;
  signals: SignalKind[];
  primarySignal: SignalKind;
  recommendation: Recommendation;
  warehouseStock: number;
  peers: { storeId: string; storeName: string; stock: number; cover: number; surplus: number }[];
};

export const productById = (id: string) => products.find((p) => p.id === id)!;
export const storeById = (id: string) => stores.find((s) => s.id === id)!;

const r1 = (n: number) => Math.round(n * 10) / 10;

export function computeMetrics(row: InventoryRow): Metrics {
  const recentDaily = row.recentWeekUnits / 7;
  const prevDaily = row.prevWeekUnits / 7;
  return {
    recentDaily: r1(recentDaily),
    prevDaily: r1(prevDaily),
    accel: r1(row.recentWeekUnits / Math.max(1, row.prevWeekUnits)),
    cover: r1(row.stock / Math.max(0.1, recentDaily)),
    expectedDemand: row.recentWeekUnits,
  };
}

export const SIGNAL_LABEL: Record<SignalKind, string> = {
  demand_surge: "Demand Surge",
  stockout_risk: "Stockout Risk",
  network_imbalance: "Network Imbalance",
  warehouse_dependency: "Warehouse Dependency",
  supply_constraint: "Supply Constraint",
  healthy: "Healthy",
};

export function buildOpportunity(
  row: InventoryRow,
  rows: InventoryRow[],
  warehouse: Record<string, number>,
): Opportunity {
  const product = productById(row.productId);
  const m = computeMetrics(row);
  const warehouseStock = warehouse[row.productId] ?? 0;

  const peers = rows
    .filter((r) => r.productId === row.productId && r.storeId !== row.storeId)
    .map((r) => {
      const pm = computeMetrics(r);
      const surplus = Math.floor(r.stock - pm.recentDaily * DONOR_KEEP_DAYS);
      return {
        storeId: r.storeId,
        storeName: storeById(r.storeId).name,
        stock: r.stock,
        cover: pm.cover,
        surplus: Math.max(0, surplus),
        recentDaily: pm.recentDaily,
      };
    })
    .sort((a, b) => b.surplus - a.surplus);

  const need = Math.max(0, Math.ceil(m.expectedDemand - row.stock - row.inTransit));
  const signals: SignalKind[] = [];
  if (m.accel >= SURGE_RATIO) signals.push("demand_surge");
  if (m.cover < RISK_COVER) signals.push("stockout_risk");

  let rec: Recommendation;

  if (m.cover >= RISK_COVER || need <= 0) {
    if (signals.length === 0) signals.push("healthy");
    rec = {
      kind: "none",
      qty: 0,
      reasons: [
        `${m.cover} days of cover comfortably exceeds the ${RISK_COVER}-day risk threshold`,
        `Expected demand of ${m.expectedDemand} units over the next ${REVIEW_DAYS} days is covered by on-hand stock`,
      ],
      confidence: "High",
      alternative: "Transfer and warehouse pull were both evaluated and rejected as unnecessary movement.",
      coverAfter: m.cover,
    };
    return {
      rowId: row.id,
      product,
      storeId: row.storeId,
      storeName: storeById(row.storeId).name,
      category: product.category,
      stock: row.stock,
      inTransit: row.inTransit,
      metrics: m,
      signals,
      primarySignal: signals[0]!,
      recommendation: rec,
      warehouseStock,
      peers,
    };
  }

  const donor = peers.find((p) => p.surplus >= MIN_TRANSFER && p.cover >= DONOR_KEEP_DAYS + 2);

  if (donor) {
    const qty = Math.min(need, donor.surplus);
    signals.push("network_imbalance");
    rec = {
      kind: "transfer",
      qty,
      sourceStoreId: donor.storeId,
      reasons: [
        m.accel >= SURGE_RATIO
          ? `Demand accelerated ${Math.round((m.accel - 1) * 100)}% (${row.prevWeekUnits} → ${row.recentWeekUnits} units/week)`
          : `Demand is steady at ${row.recentWeekUnits} units/week but cover is short`,
        `${storeById(row.storeId).name} holds only ${m.cover} days of cover`,
        `${donor.storeName} holds ${donor.cover} days of cover — ${donor.surplus} units above its own ${DONOR_KEEP_DAYS}-day need`,
        "Rebalancing locally avoids an unnecessary warehouse pull",
      ],
      confidence: qty >= need ? "High" : "Medium",
      alternative: `Warehouse pull of ${need} units was available (${warehouseStock} on hand) but rejected: city inventory already sits closer to the demand.`,
      coverAfter: r1((row.stock + qty) / Math.max(0.1, m.recentDaily)),
      sourceCoverAfter: r1((donor.stock - qty) / Math.max(0.1, donor.recentDaily)),
    };
  } else if (warehouseStock > 0) {
    const qty = Math.min(need, warehouseStock);
    signals.push("warehouse_dependency");
    rec = {
      kind: "replenish",
      qty,
      reasons: [
        m.accel >= SURGE_RATIO
          ? `Demand accelerated ${Math.round((m.accel - 1) * 100)}% (${row.prevWeekUnits} → ${row.recentWeekUnits} units/week)`
          : `Expected demand of ${m.expectedDemand} units exceeds available stock`,
        `Only ${m.cover} days of cover remaining at ${storeById(row.storeId).name}`,
        `No ${CITY_LABEL} store holds transferable excess above its own ${DONOR_KEEP_DAYS}-day need`,
        `Warehouse has ${warehouseStock} units available — next closest source`,
      ],
      confidence: qty >= need ? "High" : "Medium",
      alternative: `Inter-store transfer was evaluated first; best city peer had ${peers[0]?.surplus ?? 0} transferable units.`,
      coverAfter: r1((row.stock + qty) / Math.max(0.1, m.recentDaily)),
    };
  } else {
    signals.push("supply_constraint");
    rec = {
      kind: "constraint",
      qty: 0,
      reasons: [
        `Demand exists (${row.recentWeekUnits} units/week) but inventory is unavailable across the current network`,
        `No ${CITY_LABEL} store holds transferable excess inventory`,
        "Warehouse availability is 0 units",
        "Optimisation cannot resolve this — it needs a supply decision",
      ],
      confidence: "Medium",
      alternative: "Transfer and warehouse replenishment were both evaluated; neither source has inventory.",
      coverAfter: m.cover,
    };
  }

  return {
    rowId: row.id,
    product,
    storeId: row.storeId,
    storeName: storeById(row.storeId).name,
    category: product.category,
    stock: row.stock,
    inTransit: row.inTransit,
    metrics: m,
    signals,
    primarySignal:
      rec.kind === "constraint"
        ? "supply_constraint"
        : signals.includes("demand_surge")
          ? "demand_surge"
          : signals[0]!,
    recommendation: rec,
    warehouseStock,
    peers,
  };
}

const CITY_LABEL = "Bangalore";

export function buildAll(
  rows: InventoryRow[],
  warehouse: Record<string, number>,
): Opportunity[] {
  return rows.map((r) => buildOpportunity(r, rows, warehouse));
}

const PRIORITY: Record<ActionKind, number> = {
  constraint: 0,
  transfer: 1,
  replenish: 2,
  none: 3,
};

export function sortOpportunities(list: Opportunity[]) {
  return [...list].sort(
    (a, b) =>
      PRIORITY[a.recommendation.kind] - PRIORITY[b.recommendation.kind] ||
      a.metrics.cover - b.metrics.cover,
  );
}
