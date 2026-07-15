import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Contract, WebhookProfile } from "@/lib/terminal/types";

interface Props {
  contracts: Contract[];
  profiles: WebhookProfile[];
  onEdit: (c: Contract) => void;
  onDelete: (c: Contract) => void;
}

export function ContractsTable({ contracts, profiles, onEdit, onDelete }: Props) {
  const profileName = (id: string) => profiles.find((p) => p.id === id)?.name ?? "—";

  return (
    <section className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-border p-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Contracts To Monitor</h2>
          <p className="text-sm text-muted-foreground">
            {contracts.length} contract{contracts.length === 1 ? "" : "s"} configured
          </p>
        </div>
      </div>

      {contracts.length === 0 ? (
        <div className="p-10 text-center text-sm text-muted-foreground">
          No contracts yet — build one above to start.
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
                <Th>Condition</Th>
                <Th>Threshold</Th>
                <Th>Webhook Profile</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => (
                <tr key={c.id} className="border-b border-border/60 last:border-0 hover:bg-surface/40">
                  <Td className="font-medium">{c.instrument}</Td>
                  <Td className="tabular text-muted-foreground">{c.expiry}</Td>
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
                  <Td className="tabular">{c.trigger_direction}</Td>
                  <Td className="tabular">{c.delta_threshold}</Td>
                  <Td className="text-muted-foreground">{profileName(c.webhook_profile_id)}</Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => onEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onDelete(c)}
                        className="text-danger hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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

const Th = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <th className={`px-6 py-3 text-left font-medium ${className}`}>{children}</th>
);
const Td = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <td className={`px-6 py-3 ${className}`}>{children}</td>
);
