import { createFileRoute } from "@tanstack/react-router";

import { ActivityFeed } from "@/components/copilot/ActivityFeed";
import { SectionTitle } from "@/components/copilot/primitives";
import { Button } from "@/components/ui/button";
import { products } from "@/lib/copilot/data";
import { useCopilot } from "@/lib/copilot/store";

export const Route = createFileRoute("/activity")({
  head: () => ({
    meta: [
      { title: "Activity · Inventory Copilot" },
      {
        name: "description",
        content:
          "Operational log of executed transfers, warehouse replenishments and escalations — synthetic demo data.",
      },
      { property: "og:title", content: "Activity — Inventory Copilot" },
      {
        property: "og:description",
        content: "Every executed transfer, replenishment and supply-constraint escalation in one log.",
      },
    ],
  }),
  component: ActivityPage,
});

function ActivityPage() {
  const { warehouse, reset, activity } = useCopilot();

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Activity"
        hint="Session state only — nothing is sent to an external system."
        right={
          <Button variant="ghost" size="sm" onClick={reset} disabled={activity.length === 0}>
            Reset demo state
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <ActivityFeed />
        <div className="panel p-4 sm:p-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Warehouse on hand
          </h3>
          <ul className="mt-4 space-y-2">
            {products.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">
                  {p.name}
                  <span className="ml-2 text-xs text-muted-foreground">{p.category}</span>
                </span>
                <span
                  className={`shrink-0 font-semibold tabular-nums ${
                    (warehouse[p.id] ?? 0) === 0 ? "text-destructive" : ""
                  }`}
                >
                  {warehouse[p.id] ?? 0}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
