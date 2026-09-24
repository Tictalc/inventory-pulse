import { Link } from "@tanstack/react-router";
import { Activity, Boxes, LayoutDashboard, Sparkles, Star } from "lucide-react";
import type { ReactNode } from "react";

import { DemoTag } from "@/components/copilot/primitives";

const NAV = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/best-sellers", label: "Best Sellers", icon: Star },
  { to: "/opportunities", label: "Opportunities", icon: Boxes },
  { to: "/activity", label: "Activity", icon: Activity },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/20 text-primary-glow glow-ring">
                <Sparkles className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold tracking-tight sm:text-lg">
                  Inventory Copilot
                </h1>
                <p className="truncate text-xs text-muted-foreground">
                  Network-aware replenishment intelligence
                </p>
              </div>
            </div>
            <DemoTag className="hidden sm:inline-flex" />
          </div>

          <nav className="mt-3 flex gap-1 overflow-x-auto pb-0.5">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.to === "/" }}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
                activeProps={{
                  className: "bg-primary/20 text-primary-glow",
                }}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
