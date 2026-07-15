import { StatusBadge } from "./StatusBadge";
import type { LiveContract } from "@/lib/terminal/types";

interface Props {
  live: LiveContract[];
}

export function MonitoringDashboard({ live }: Props) {
  return (
    <section className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-border p-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Live Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Streaming from the monitoring engine
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          Live
        </div>
      </div>

      {live.length === 0 ? (
        <div className="p-10 text-center text-sm text-muted-foreground">
          Waiting for live ticks from the engine…
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/50 text-xs uppercase tracking-wide text-muted-foreground">
                <Th>Instrument</Th>
                <Th>Expiry</Th>
                <Th>Strike</Th>
                <Th>Type</Th>
                <Th className="text-right">Spot</Th>
                <Th className="text-right">Premium</Th>
                <Th className="text-right">Δ Current</Th>
                <Th className="text-right">Δ Target</Th>
                <Th>Condition</Th>
                <Th>Status</Th>
                <Th>Triggered</Th>
                <Th>Updated</Th>
              </tr>
            </thead>
            <tbody>
              {live.map((c) => (
                <tr key={c.id} className="border-b border-border/60 last:border-0 hover:bg-surface/40">
                  <Td className="font-medium">{c.instrument}</Td>
                  <Td className="text-muted-foreground">{c.expiry}</Td>
                  <Td className="tabular">{c.strike}</Td>
                  <Td>
                    <span
                      className={
                        c.option_type === "CE"
                          ? "rounded-md bg-success/15 px-2 py-0.5 text-xs font-medium text-success"
                          : "rounded-md bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary"
                      }
                    >
                      {c.option_type}
                    </span>
                  </Td>
                  <Td className="tabular text-right">{fmt(c.spot)}</Td>
                  <Td className="tabular text-right">{fmt(c.premium)}</Td>
                  <Td className="tabular text-right font-medium">
                    {c.current_delta != null ? c.current_delta.toFixed(3) : "—"}
                  </Td>
                  <Td className="tabular text-right text-muted-foreground">
                    {c.delta_threshold.toFixed(3)}
                  </Td>
                  <Td className="tabular">{c.trigger_direction}</Td>
                  <Td><StatusBadge status={c.status} /></Td>
                  <Td>
                    {c.triggered ? (
                      <span className="rounded-md bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
                        YES
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">no</span>
                    )}
                  </Td>
                  <Td className="tabular text-xs text-muted-foreground">
                    {c.last_updated ? new Date(c.last_updated).toLocaleTimeString("en-IN", { hour12: false }) : "—"}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function fmt(v: number | null) {
  if (v == null) return "—";
  return v.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

const Th = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <th className={`px-4 py-3 text-left font-medium ${className}`}>{children}</th>
);
const Td = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <td className={`px-4 py-3 ${className}`}>{children}</td>
);
