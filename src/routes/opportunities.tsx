import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { OpportunityList } from "@/components/copilot/OpportunityList";
import { DemoTag, SectionTitle } from "@/components/copilot/primitives";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { sortOpportunities } from "@/lib/copilot/engine";
import { useCopilot } from "@/lib/copilot/store";

export const Route = createFileRoute("/opportunities")({
  head: () => ({
    meta: [
      { title: "Network Opportunities · Inventory Copilot" },
      {
        name: "description",
        content:
          "Open transfer, warehouse replenishment and supply-constraint recommendations with reasoning — synthetic demo data.",
      },
      { property: "og:title", content: "Network Opportunities — Inventory Copilot" },
      {
        property: "og:description",
        content: "Recommended source, quantity and reasoning for every inventory risk in the network.",
      },
    ],
  }),
  component: Opportunities,
});

function Opportunities() {
  const { opportunities, statuses } = useCopilot();
  const [tab, setTab] = useState("open");

  const all = sortOpportunities(opportunities.filter((o) => o.recommendation.kind !== "none"));
  const items =
    tab === "open"
      ? all.filter((o) => (statuses[o.rowId] ?? "open") === "open")
      : tab === "resolved"
        ? all.filter((o) => ["resolved", "dismissed"].includes(statuses[o.rowId] ?? ""))
        : all.filter((o) => (statuses[o.rowId] ?? "") === "escalated");

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Network opportunities"
        hint="Each recommendation shows its source decision, quantity and reasoning."
        right={<DemoTag className="hidden sm:inline-flex" />}
      />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-surface-2">
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="escalated">Escalated</TabsTrigger>
        </TabsList>
      </Tabs>
      <OpportunityList items={items} emptyText="Nothing here yet." />
    </div>
  );
}
