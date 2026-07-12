import { useEffect, useState } from "react";
import { Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EXPIRIES,
  INSTRUMENTS,
  strikesFor,
} from "@/lib/terminal/instruments";
import type {
  Condition,
  Contract,
  Instrument,
  OptionType,
  WebhookProfile,
} from "@/lib/terminal/types";
import { toast } from "sonner";

const CONDITIONS: Condition[] = ["<", "<=", ">", ">=", "="];

interface Props {
  profiles: WebhookProfile[];
  editing?: Contract | null;
  onSubmit: (c: Omit<Contract, "id">) => void;
  onCancelEdit?: () => void;
}

interface FormState {
  instrument: Instrument;
  expiry: string;
  strike: string;
  optionType: OptionType;
  condition: Condition;
  threshold: string;
  webhookProfileId: string;
}

const empty = (profiles: WebhookProfile[]): FormState => ({
  instrument: "NIFTY",
  expiry: EXPIRIES[0] ?? "",
  strike: String(strikesFor("NIFTY")[20]),
  optionType: "CE",
  condition: "<",
  threshold: "0.3",
  webhookProfileId: profiles[0]?.id ?? "",
});

export function ContractBuilder({ profiles, editing, onSubmit, onCancelEdit }: Props) {
  const [form, setForm] = useState<FormState>(() => empty(profiles));

  useEffect(() => {
    if (editing) {
      setForm({
        instrument: editing.instrument,
        expiry: editing.expiry,
        strike: String(editing.strike),
        optionType: editing.optionType,
        condition: editing.condition,
        threshold: String(editing.threshold),
        webhookProfileId: editing.webhookProfileId,
      });
    }
  }, [editing]);

  useEffect(() => {
    // keep webhook default aligned when profiles load
    if (!form.webhookProfileId && profiles[0]) {
      setForm((f) => ({ ...f, webhookProfileId: profiles[0].id }));
    }
  }, [profiles, form.webhookProfileId]);

  const strikes = strikesFor(form.instrument);

  const handleAdd = () => {
    const threshold = Number(form.threshold);
    const strike = Number(form.strike);
    if (!form.webhookProfileId) {
      toast.error("Create a webhook profile first.");
      return;
    }
    if (Number.isNaN(threshold)) {
      toast.error("Delta threshold must be a number.");
      return;
    }
    if (Number.isNaN(strike)) {
      toast.error("Strike must be a number.");
      return;
    }
    onSubmit({
      instrument: form.instrument,
      expiry: form.expiry,
      strike,
      optionType: form.optionType,
      condition: form.condition,
      threshold,
      webhookProfileId: form.webhookProfileId,
    });
    if (!editing) setForm(empty(profiles));
  };

  const handleClear = () => {
    setForm(empty(profiles));
    onCancelEdit?.();
  };

  return (
    <section className="panel p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Contract Builder</h2>
          <p className="text-sm text-muted-foreground">
            {editing ? "Update contract parameters" : "Configure a contract to monitor"}
          </p>
        </div>
        {editing && (
          <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary ring-1 ring-primary/30">
            Editing
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Instrument">
          <Select
            value={form.instrument}
            onValueChange={(v: Instrument) =>
              setForm((f) => ({
                ...f,
                instrument: v,
                strike: String(strikesFor(v)[20]),
              }))
            }
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {INSTRUMENTS.map((i) => (
                <SelectItem key={i} value={i}>{i}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Expiry">
          <Select
            value={form.expiry}
            onValueChange={(v) => setForm((f) => ({ ...f, expiry: v }))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {EXPIRIES.map((e) => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Strike">
          <Select
            value={form.strike}
            onValueChange={(v) => setForm((f) => ({ ...f, strike: v }))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-64">
              {strikes.map((s) => (
                <SelectItem key={s} value={String(s)}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Option Type">
          <Select
            value={form.optionType}
            onValueChange={(v: OptionType) => setForm((f) => ({ ...f, optionType: v }))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="CE">CE (Call)</SelectItem>
              <SelectItem value="PE">PE (Put)</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field label="Condition">
          <Select
            value={form.condition}
            onValueChange={(v: Condition) => setForm((f) => ({ ...f, condition: v }))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CONDITIONS.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Delta Threshold">
          <Input
            inputMode="decimal"
            value={form.threshold}
            onChange={(e) => setForm((f) => ({ ...f, threshold: e.target.value }))}
            className="tabular"
          />
        </Field>

        <Field label="Webhook Profile" className="sm:col-span-2">
          <Select
            value={form.webhookProfileId}
            onValueChange={(v) => setForm((f) => ({ ...f, webhookProfileId: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder={profiles.length ? "Select profile" : "No profiles yet"} />
            </SelectTrigger>
            <SelectContent>
              {profiles.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          {editing ? "Update Contract" : "Add Contract"}
        </Button>
        <Button variant="outline" onClick={handleClear} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Clear
        </Button>
      </div>
    </section>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
