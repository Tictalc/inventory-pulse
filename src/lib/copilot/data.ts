// Synthetic demo data for the Inventory Copilot prototype.
// All numbers are fabricated for demonstration purposes only.

export type Category = "Frames" | "Sunglasses" | "Lenses";

export type Store = {
  id: string;
  name: string;
  city: string;
  code: string;
};

export type Product = {
  id: string;
  name: string;
  category: Category;
};

export type InventoryRow = {
  id: string;
  productId: string;
  storeId: string;
  stock: number;
  inTransit: number;
  /** units sold in the previous 7-day period */
  prevWeekUnits: number;
  /** units sold in the most recent 7-day period */
  recentWeekUnits: number;
};

export const CITY = "Bangalore";

export const stores: Store[] = [
  { id: "kor", name: "Koramangala", code: "BLR-KOR", city: CITY },
  { id: "ind", name: "Indiranagar", code: "BLR-IND", city: CITY },
  { id: "whf", name: "Whitefield", code: "BLR-WHF", city: CITY },
  { id: "hsr", name: "HSR Layout", code: "BLR-HSR", city: CITY },
  { id: "jay", name: "Jayanagar", code: "BLR-JAY", city: CITY },
];

export const products: Product[] = [
  { id: "SG-AVX-01", name: "Aviator X", category: "Sunglasses" },
  { id: "SG-WFR-02", name: "Wayfarer Noir", category: "Sunglasses" },
  { id: "SG-CLP-03", name: "Clubmaster Pro", category: "Sunglasses" },
  { id: "SG-SPT-04", name: "Sport Shield", category: "Sunglasses" },
  { id: "FR-BLZ-11", name: "Blaze Titan", category: "Frames" },
  { id: "FR-RTR-12", name: "Retro Round", category: "Frames" },
  { id: "FR-URB-13", name: "Urban Rect", category: "Frames" },
  { id: "FR-AIR-14", name: "AirFlex Lite", category: "Frames" },
  { id: "FR-HEX-15", name: "Hexa Metal", category: "Frames" },
  { id: "LN-BLU-21", name: "BlueShield Pro", category: "Lenses" },
  { id: "LN-PRG-22", name: "Progressive Ultra", category: "Lenses" },
  { id: "LN-PHO-23", name: "Photochromic Grey", category: "Lenses" },
  { id: "LN-THN-24", name: "ThinEdge 1.67", category: "Lenses" },
];

/** Warehouse (Bangalore DC) availability per product. */
export const initialWarehouse: Record<string, number> = {
  "SG-AVX-01": 64,
  "SG-WFR-02": 110,
  "SG-CLP-03": 38,
  "SG-SPT-04": 72,
  "FR-BLZ-11": 120,
  "FR-RTR-12": 54,
  "FR-URB-13": 96,
  "FR-AIR-14": 12,
  "FR-HEX-15": 40,
  "LN-BLU-21": 0,
  "LN-PRG-22": 85,
  "LN-PHO-23": 26,
  "LN-THN-24": 140,
};

const row = (
  productId: string,
  storeId: string,
  stock: number,
  prevWeekUnits: number,
  recentWeekUnits: number,
  inTransit = 0,
): InventoryRow => ({
  id: `${productId}:${storeId}`,
  productId,
  storeId,
  stock,
  inTransit,
  prevWeekUnits,
  recentWeekUnits,
});

export const initialRows: InventoryRow[] = [
  // SCENARIO A — city transfer: Koramangala low + surging, Indiranagar excess
  row("SG-AVX-01", "kor", 8, 18, 28),
  row("SG-AVX-01", "ind", 42, 20, 21),
  row("SG-AVX-01", "whf", 19, 14, 15),
  row("SG-AVX-01", "hsr", 24, 16, 17),
  row("SG-AVX-01", "jay", 16, 12, 12),

  // SCENARIO B — warehouse replenishment: no city excess, warehouse has stock
  row("LN-PRG-22", "kor", 9, 16, 24),
  row("LN-PRG-22", "ind", 16, 18, 17),
  row("LN-PRG-22", "hsr", 12, 13, 13),

  // SCENARIO C — supply constraint at ONE store; others healthy, no excess, warehouse 0
  row("LN-BLU-21", "kor", 5, 17, 23),
  row("LN-BLU-21", "ind", 18, 15, 16),
  row("LN-BLU-21", "whf", 15, 13, 14),
  row("LN-BLU-21", "jay", 16, 12, 13),

  // SCENARIO D — healthy / stable, no action
  row("FR-BLZ-11", "kor", 28, 20, 21),
  row("FR-BLZ-11", "ind", 30, 22, 23),
  row("FR-BLZ-11", "whf", 22, 16, 17),
  row("FR-BLZ-11", "jay", 24, 18, 18),

  // SCENARIO E — imbalance: HSR accelerating (not urgent), Whitefield heavy excess → monitor
  row("SG-WFR-02", "hsr", 16, 14, 21),
  row("SG-WFR-02", "whf", 46, 18, 17),
  row("SG-WFR-02", "kor", 34, 21, 22),

  // Supporting mix
  row("FR-RTR-12", "jay", 7, 12, 18), // second city transfer (from Koramangala)
  row("FR-RTR-12", "kor", 38, 13, 13),
  row("FR-AIR-14", "whf", 6, 15, 21), // second warehouse replenishment
  row("FR-AIR-14", "kor", 18, 16, 16),
  row("SG-CLP-03", "ind", 12, 14, 15, 6),
  row("SG-CLP-03", "jay", 31, 12, 12),
  row("SG-SPT-04", "whf", 27, 15, 16),
  row("FR-URB-13", "ind", 44, 20, 19),
  row("FR-URB-13", "hsr", 22, 17, 18),
  row("FR-HEX-15", "hsr", 29, 13, 12),
  row("LN-PHO-23", "jay", 25, 14, 14),
  row("LN-THN-24", "whf", 33, 19, 20),
  row("LN-THN-24", "hsr", 48, 21, 20),
];

export type TransferRecord = {
  id: string;
  productName: string;
  sourceStore: string;
  destStore: string;
  units: number;
  when: string;
  coverBefore: number;
  coverAfter: number;
  live?: boolean;
};

/** Synthetic history of completed city transfers (each one = a warehouse pull avoided). */
export const seedTransfers: TransferRecord[] = [
  { id: "h1", productName: "Urban Rect", sourceStore: "Indiranagar", destStore: "HSR Layout", units: 12, when: "Sep 24 · completed", coverBefore: 2.4, coverAfter: 7.1 },
  { id: "h2", productName: "ThinEdge 1.67", sourceStore: "HSR Layout", destStore: "Jayanagar", units: 9, when: "Sep 23 · completed", coverBefore: 3.1, coverAfter: 7.6 },
  { id: "h3", productName: "Wayfarer Noir", sourceStore: "Whitefield", destStore: "Koramangala", units: 14, when: "Sep 22 · completed", coverBefore: 1.9, coverAfter: 6.4 },
  { id: "h4", productName: "Hexa Metal", sourceStore: "Jayanagar", destStore: "Indiranagar", units: 8, when: "Sep 21 · completed", coverBefore: 2.8, coverAfter: 7.0 },
  { id: "h5", productName: "Sport Shield", sourceStore: "Koramangala", destStore: "Whitefield", units: 10, when: "Sep 20 · completed", coverBefore: 3.3, coverAfter: 8.0 },
  { id: "h6", productName: "Photochromic Grey", sourceStore: "Indiranagar", destStore: "Jayanagar", units: 7, when: "Sep 19 · completed", coverBefore: 2.6, coverAfter: 6.9 },
];

/** Synthetic baseline of historical recommendations for the intervention metric. */
export const historicalRecs = { auto: 34, assisted: 9, manual: 3 };

/** Summary-only demo data for other cities. */
export const otherCities = [
  { name: "Delhi NCR", stores: 42, atRisk: 9, health: 78 },
  { name: "Mumbai", stores: 38, atRisk: 6, health: 84 },
  { name: "Hyderabad", stores: 21, atRisk: 4, health: 81 },
  { name: "Chennai", stores: 19, atRisk: 5, health: 76 },
];
