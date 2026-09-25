import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, Boxes, Radio, Warehouse } from "lucide-react";

import { MetricDrawer, type MetricKey } from "@/components/copilot/MetricDrawer";
import { ActivityFeed } from "@/components/copilot/ActivityFeed";
import { OpportunityList } from "@/components/copilot/OpportunityList";
import { CoverPill, DemoTag, KpiCard, SectionTitle } from "@/components/copilot/primitives";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { otherCities, stores } from "@/lib/copilot/data";
import { RISK_COVER } from "@/lib/copilot/engine";
import { useCopilot } from "@/lib/copilot/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview · Inventory Copilot" },
      {
        name: "description",
        content:
          "Network control tower for best-seller inventory risk across Bangalore stores — synthetic demo data.",
      },
      { property: "og:title", content: "Inventory Copilot — Network Control Tower" },
      {
        property: "og:description",
        content: "Detect demand surges, rebalance city inventory and avoid unnecessary warehouse pulls.",
      },
    ],
  }),
  component: Overview,
});

function Overview() {
  const { opportunities, priority, metrics } = useCopilot();
  const [scope, setScope] = useState("bangalore");
  const [storeId, setStoreId] = useState(stores[0]!.id);
  const [metric, setMetric] = useState<MetricKey | null>(null);

  const atRisk = opportunities.filter((o) => o.metrics.cover < RISK_COVER).length;
  const signals = opportunities.filter((o) => o.signals.includes("demand_surge")).length;

  const storeHealth = useMemo(
    () =>
      stores.map((s) => {
        const rows = opportunities.filter((o) => o.storeId === s.id);
        const risk = rows.filter((o) => o.metrics.cover < RISK_COVER).length;
        const avgCover =
          rows.reduce((a, o) => a + o.metrics.cover, 0) / Math.max(1, rows.length);
        return { store: s, skus: rows.length, risk, avgCover };
      }),
    [opportunities],
  );

  const storeRows = opportunities.filter((o) => o.storeId === storeId);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Best Sellers at Risk"
          value={atRisk}
          sub={`SKU-store pairs under ${RISK_COVER} days of cover`}
          onClick={() => setMetric("risk")}
          icon={AlertTriangle}
          accent="destructive"
        />
        <KpiCard
          label="Demand Signals"
          value={signals}
          sub="Best sellers with accelerating demand"
          onClick={() => setMetric("signals")}
          icon={Radio}
          accent="warning"
        />
        <KpiCard
          label="Network Opportunities"
          value={priority.length}
          sub="Open actions across stores and warehouse"
          onClick={() => setMetric("network")}
          icon={Boxes}
          accent="primary"
        />
        <KpiCard
          label="Avoided Warehouse Pulls"
          value={metrics.avoidedPulls}
          sub="Demand fulfilled through city inventory"
          onClick={() => setMetric("avoided")}
          icon={Warehouse}
          accent="success"
        />
      </div>

      <div className="panel grid gap-4 p-4 sm:grid-cols-3 sm:p-5">
        {[
          {
            label: "Right-Place Inventory",
            value: `${metrics.rightPlace}%`,
            sub: "Best-seller units positioned near expected demand",
            key: "rightPlace" as const,
          },
          {
            label: "Avoided Warehouse Pulls",
            value: `${metrics.avoidedPulls}`,
            sub: "Demand fulfilled through city inventory",
            key: "avoided" as const,
          },
          {
            label: "Human Intervention Rate",
            value: `${metrics.interventionRate}%`,
            sub: "Recommendations requiring manual action",
            key: "intervention" as const,
          },
        ].map((m) => (
          <button
            key={m.label}
            type="button"
            onClick={() => setMetric(m.key)}
            className="-m-2 rounded-xl p-2 text-left transition-colors hover:bg-surface-2"
          >
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{m.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{m.value}</p>
            <p className="text-xs text-muted-foreground">{m.sub}</p>
          </button>
        ))}
        <p className="text-[11px] text-muted-foreground sm:col-span-3">
          Demo metrics from synthetic data · prototype decision rules, not production ML.
        </p>
      </div>

      <section>
        <SectionTitle
          title="Network control tower"
          hint="India rollups are summary demo data. Bangalore carries the modelled network."
          right={<DemoTag className="hidden sm:inline-flex" />}
        />
        <Tabs value={scope} onValueChange={setScope}>
          <TabsList className="bg-surface-2">
            <TabsTrigger value="india">India</TabsTrigger>
            <TabsTrigger value="bangalore">Bangalore</TabsTrigger>
            <TabsTrigger value="store">Store</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="mt-4">
          {scope === "india" ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div className="panel border-primary/40 bg-primary/10 p-4">
                <p className="text-sm font-semibold">Bangalore</p>
                <p className="text-xs text-muted-foreground">
                  {stores.length} modelled stores · {opportunities.length} best-seller positions
                </p>
                <p className="mt-3 text-2xl font-semibold tabular-nums">{atRisk} at risk</p>
                <p className="text-xs text-primary-glow">Fully modelled in this prototype</p>
              </div>
              {otherCities.map((c) => (
                <div key={c.name} className="panel p-4">
                  <p className="text-sm font-semibold">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.stores} stores · summary only</p>
                  <p className="mt-3 text-2xl font-semibold tabular-nums">{c.atRisk} at risk</p>
                  <p className="text-xs text-muted-foreground">Health index {c.health}</p>
                </div>
              ))}
            </div>
          ) : scope === "bangalore" ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {storeHealth.map((h) => (
                <div key={h.store.id} className="panel p-4">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{h.store.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{h.store.code}</p>
                    </div>
                    <CoverPill cover={h.avgCover} />
                  </div>
                  <div className="mt-4 flex items-end justify-between gap-2">
                    <div>
                      <p className="text-2xl font-semibold tabular-nums">{h.risk}</p>
                      <p className="text-xs text-muted-foreground">best sellers at risk</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{h.skus} tracked SKUs</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <Select value={storeId} onValueChange={setStoreId}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <OpportunityList items={storeRows} emptyText="No tracked best sellers at this store." />
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div>
          <SectionTitle
            title="Priority opportunities"
            hint="Ranked by supply constraint, then by lowest days of cover."
          />
          <OpportunityList items={priority} emptyText="All open recommendations are resolved." />
        </div>
        <div className="xl:pt-9">
          <ActivityFeed limit={6} />
        </div>
      </section>
      <MetricDrawer metric={metric} onClose={() => setMetric(null)} />
    </div>
  );
}
