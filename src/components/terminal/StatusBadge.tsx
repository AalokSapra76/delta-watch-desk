import { cn } from "@/lib/utils";
import type { ContractStatus } from "@/lib/terminal/types";

interface Props {
  status: ContractStatus;
}

const map: Record<ContractStatus, { label: string; className: string }> = {
  monitoring: {
    label: "Monitoring",
    className: "bg-success/15 text-success ring-1 ring-success/30",
  },
  triggered: {
    label: "Triggered",
    className: "bg-warning/15 text-warning ring-1 ring-warning/30",
  },
  disconnected: {
    label: "Disconnected",
    className: "bg-danger/15 text-danger ring-1 ring-danger/30",
  },
  idle: {
    label: "Idle",
    className: "bg-muted text-muted-foreground ring-1 ring-border",
  },
};

export function StatusBadge({ status }: Props) {
  const s = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        s.className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  );
}
