import { Activity, Radio } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { EngineStatus } from "@/lib/terminal/types";
import { cn } from "@/lib/utils";

interface Props {
  status: EngineStatus | undefined;
}

export function TerminalHeader({ status }: Props) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const connected = status?.connected ?? false;
  const state = status?.state ?? "idle";

  const dotColor =
    state === "running"
      ? "bg-success"
      : state === "paused"
        ? "bg-warning"
        : connected
          ? "bg-success"
          : "bg-danger";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto grid max-w-[1600px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-4 sm:flex sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
            <Activity className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-base font-semibold tracking-tight">
              BK Delta Terminal
            </div>
            <div className="text-xs text-muted-foreground">v2.0 · Options Delta Monitor</div>
          </div>
        </div>

        <nav className="flex items-center gap-1">
          {[
            { to: "/", label: "Terminal" },
            { to: "/profiles", label: "Webhook Profiles" },
          ].map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-surface-elevated text-foreground"
                    : "text-muted-foreground hover:bg-surface hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs">
            <span className={cn("relative flex h-2 w-2")}>
              <span
                className={cn(
                  "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
                  dotColor,
                )}
              />
              <span className={cn("relative inline-flex h-2 w-2 rounded-full", dotColor)} />
            </span>
            <Radio className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium uppercase tracking-wide">
              {state === "running"
                ? "Live"
                : state === "paused"
                  ? "Paused"
                  : connected
                    ? "Ready"
                    : "Disconnected"}
            </span>
          </div>
          <div className="tabular hidden text-sm text-muted-foreground sm:block">
            {now.toLocaleTimeString("en-IN", { hour12: false })}
          </div>
        </div>
      </div>
    </header>
  );
}
