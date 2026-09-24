import { ArrowLeftRight, Check, TriangleAlert, XCircle } from "lucide-react";

import { useCopilot } from "@/lib/copilot/store";

const ICONS = {
  transfer: { icon: ArrowLeftRight, cls: "text-primary-glow bg-primary/15" },
  replenish: { icon: Check, cls: "text-info bg-info/15" },
  escalate: { icon: TriangleAlert, cls: "text-warning bg-warning/15" },
  dismiss: { icon: XCircle, cls: "text-muted-foreground bg-muted" },
} as const;

export function ActivityFeed({ limit }: { limit?: number }) {
  const { activity } = useCopilot();
  const items = limit ? activity.slice(0, limit) : activity;

  return (
    <div className="panel p-4 sm:p-5">
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Recent actions
      </h3>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No actions yet. Execute a recommendation to see the operational log build up.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((a) => {
            const { icon: Icon, cls } = ICONS[a.kind];
            return (
              <li key={a.id} className="flex items-start gap-3">
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${cls}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{a.detail}</p>
                </div>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{a.at}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
