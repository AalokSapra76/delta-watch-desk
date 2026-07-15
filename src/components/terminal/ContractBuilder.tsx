import { useEffect, useState } from "react";
import { Plus, RotateCcw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
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
import { api } from "@/lib/terminal/api";
import type {
  Contract,
  Instrument,
  OptionType,
  TriggerDirection,
  WebhookProfile,
} from "@/lib/terminal/types";
import { toast } from "sonner";

// Engine (main.py) only supports these two directions.
const DIRECTIONS: TriggerDirection[] = ["<", ">"];

interface Props {
  profiles: WebhookProfile[];
  editing?: Contract | null;
  onSubmit: (c: Omit<Contract, "id">) => void;
  onCancelEdit?: () => void;
}

interface FormState {
  instrument: Instrument | "";
  expiry: string;
  strike: string;
  option_type: OptionType;
  trigger_direction: TriggerDirection;
  delta_threshold: string;
  webhook_profile_id: string;
}

const emptyForm: FormState = {
  instrument: "",
  expiry: "",
  strike: "",
  option_type: "CE",
  trigger_direction: "<",
  delta_threshold: "0.3",
  webhook_profile_id: "",
};

export function ContractBuilder({ profiles, editing, onSubmit, onCancelEdit }: Props) {
  const [form, setForm] = useState<FormState>(emptyForm);

  const instrumentsQ = useQuery({
    queryKey: ["instruments"],
    queryFn: api.getInstruments,
  });
  const expiriesQ = useQuery({
    queryKey: ["expiries", form.instrument],
    queryFn: () => api.getExpiries(form.instrument as Instrument),
    enabled: !!form.instrument,
  });
  const strikesQ = useQuery({
    queryKey: ["strikes", form.instrument, form.expiry],
    queryFn: () => api.getStrikes(form.instrument as Instrument, form.expiry),
    enabled: !!form.instrument && !!form.expiry,
  });

  const instruments = instrumentsQ.data ?? [];
  const expiries = expiriesQ.data ?? [];
  const strikes = strikesQ.data ?? [];

  useEffect(() => {
    if (editing) {
      setForm({
        instrument: editing.instrument,
        expiry: editing.expiry,
        strike: String(editing.strike),
        option_type: editing.option_type,
        trigger_direction: editing.trigger_direction,
        delta_threshold: String(editing.delta_threshold),
        webhook_profile_id: editing.webhook_profile_id,
      });
    }
  }, [editing]);

  useEffect(() => {
    if (!form.webhook_profile_id && profiles[0]) {
      setForm((f) => ({ ...f, webhook_profile_id: profiles[0].id }));
    }
  }, [profiles, form.webhook_profile_id]);

  useEffect(() => {
    if (!form.instrument && instruments[0]) {
      setForm((f) => ({ ...f, instrument: instruments[0] }));
    }
  }, [instruments, form.instrument]);

  useEffect(() => {
    if (form.expiry && expiries.length && !expiries.includes(form.expiry)) {
      setForm((f) => ({ ...f, expiry: "", strike: "" }));
    } else if (!form.expiry && expiries[0]) {
      setForm((f) => ({ ...f, expiry: expiries[0] }));
    }
  }, [expiries, form.expiry]);

  useEffect(() => {
    if (form.strike && strikes.length && !strikes.includes(Number(form.strike))) {
      setForm((f) => ({ ...f, strike: "" }));
    }
  }, [strikes, form.strike]);

  const handleAdd = () => {
    const threshold = Number(form.delta_threshold);
    const strike = Number(form.strike);
    if (!form.instrument) return toast.error("Select an instrument.");
    if (!form.expiry) return toast.error("Select an expiry.");
    if (!form.strike) return toast.error("Select a strike.");
    if (!form.webhook_profile_id) return toast.error("Create a webhook profile first.");
    if (Number.isNaN(threshold)) return toast.error("Delta threshold must be a number.");
    if (Number.isNaN(strike)) return toast.error("Strike must be a number.");
    onSubmit({
      instrument: form.instrument,
      expiry: form.expiry,
      strike,
      option_type: form.option_type,
      trigger_direction: form.trigger_direction,
      delta_threshold: threshold,
      webhook_profile_id: form.webhook_profile_id,
    });
    if (!editing) {
      setForm((f) => ({
        ...emptyForm,
        instrument: f.instrument,
        expiry: f.expiry,
        webhook_profile_id: f.webhook_profile_id,
      }));
    }
  };

  const handleClear = () => {
    setForm(emptyForm);
    onCancelEdit?.();
  };

  const instrumentError = instrumentsQ.isError;
  const expiryDisabled = !form.instrument || expiriesQ.isLoading || expiriesQ.isError;
  const strikeDisabled = !form.expiry || strikesQ.isLoading || strikesQ.isError;

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

      {instrumentError && (
        <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
          Failed to load instruments from monitoring engine.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Instrument">
          <Select
            value={form.instrument || undefined}
            onValueChange={(v: Instrument) =>
              setForm((f) => ({ ...f, instrument: v, expiry: "", strike: "" }))
            }
            disabled={instrumentsQ.isLoading || instruments.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={instrumentsQ.isLoading ? "Loading…" : "Select instrument"} />
            </SelectTrigger>
            <SelectContent>
              {instruments.map((i) => (
                <SelectItem key={i} value={i}>{i}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Expiry">
          <Select
            value={form.expiry || undefined}
            onValueChange={(v) => setForm((f) => ({ ...f, expiry: v, strike: "" }))}
            disabled={expiryDisabled || expiries.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={expiriesQ.isLoading ? "Loading…" : "Select expiry"} />
            </SelectTrigger>
            <SelectContent>
              {expiries.map((e) => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Strike">
          <Select
            value={form.strike || undefined}
            onValueChange={(v) => setForm((f) => ({ ...f, strike: v }))}
            disabled={strikeDisabled || strikes.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={strikesQ.isLoading ? "Loading…" : "Select strike"} />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {strikes.map((s) => (
                <SelectItem key={s} value={String(s)}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Option Type">
          <Select
            value={form.option_type}
            onValueChange={(v: OptionType) => setForm((f) => ({ ...f, option_type: v }))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="CE">CE (Call)</SelectItem>
              <SelectItem value="PE">PE (Put)</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field label="Trigger Direction">
          <Select
            value={form.trigger_direction}
            onValueChange={(v: TriggerDirection) =>
              setForm((f) => ({ ...f, trigger_direction: v }))
            }
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {DIRECTIONS.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Delta Threshold">
          <Input
            inputMode="decimal"
            value={form.delta_threshold}
            onChange={(e) => setForm((f) => ({ ...f, delta_threshold: e.target.value }))}
            className="tabular"
          />
        </Field>

        <Field label="Webhook Profile" className="sm:col-span-2">
          <Select
            value={form.webhook_profile_id || undefined}
            onValueChange={(v) => setForm((f) => ({ ...f, webhook_profile_id: v }))}
            disabled={profiles.length === 0}
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
