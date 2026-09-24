import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { OpportunityList } from "@/components/copilot/OpportunityList";
import { DemoTag, SectionTitle } from "@/components/copilot/primitives";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { sortOpportunities } from "@/lib/copilot/engine";
import { useCopilot } from "@/lib/copilot/store";

export const Route = createFileRoute("/best-sellers")({
  head: () => ({
    meta: [
      { title: "Best Seller Radar · Inventory Copilot" },
      {
        name: "description",
        content:
          "Best-selling frames, sunglasses and lenses with live demand signals and inventory risk — synthetic demo data.",
      },
      { property: "og:title", content: "Best Seller Radar — Inventory Copilot" },
      {
        property: "og:description",
        content: "Demand surges and stockout risk across best-selling frames, sunglasses and lenses.",
      },
    ],
  }),
  component: BestSellers,
});

const CATS = ["All", "Frames", "Sunglasses", "Lenses"] as const;

function BestSellers() {
  const { opportunities } = useCopilot();
  const [cat, setCat] = useState<string>("All");

  const items = sortOpportunities(
    opportunities.filter((o) => cat === "All" || o.category === cat),
  );

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Best Seller Radar"
        hint="Proactive demand signals and inventory risk across the Bangalore network."
        right={<DemoTag className="hidden sm:inline-flex" />}
      />
      <Tabs value={cat} onValueChange={setCat}>
        <TabsList className="bg-surface-2">
          {CATS.map((c) => (
            <TabsTrigger key={c} value={c}>
              {c}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <OpportunityList items={items} emptyText="No best sellers in this category." />
    </div>
  );
}
