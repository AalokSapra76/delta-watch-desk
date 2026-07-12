import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Copy, Plus, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { TerminalHeader } from "@/components/terminal/TerminalHeader";
import { JsonEditor } from "@/components/terminal/JsonEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { api } from "@/lib/terminal/api";
import type { WebhookProfile } from "@/lib/terminal/types";

export const Route = createFileRoute("/profiles")({
  head: () => ({
    meta: [
      { title: "Webhook Profiles — BK Delta Terminal" },
      {
        name: "description",
        content:
          "Create, edit and test reusable webhook profiles for delta-triggered alerts.",
      },
      { property: "og:title", content: "Webhook Profiles — BK Delta Terminal" },
      {
        property: "og:description",
        content: "Manage reusable webhook payloads for the monitoring engine.",
      },
    ],
  }),
  component: ProfilesPage,
});

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

interface Draft {
  name: string;
  url: string;
  method: WebhookProfile["method"];
  headersText: string;
  payload: string;
}

const emptyDraft: Draft = {
  name: "",
  url: "",
  method: "POST",
  headersText: JSON.stringify({ "Content-Type": "application/json" }, null, 2),
  payload: "{\n  \n}",
};

function ProfilesPage() {
  const qc = useQueryClient();
  const statusQ = useQuery({ queryKey: ["status"], queryFn: api.getStatus });
  const profilesQ = useQuery({ queryKey: ["profiles"], queryFn: api.getProfiles });

  const profiles = profilesQ.data ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  useEffect(() => {
    if (!selectedId && profiles[0]) setSelectedId(profiles[0].id);
  }, [profiles, selectedId]);

  useEffect(() => {
    const p = profiles.find((x) => x.id === selectedId);
    if (p) {
      setDraft({
        name: p.name,
        url: p.url,
        method: p.method,
        headersText: JSON.stringify(p.headers, null, 2),
        payload: p.payload,
      });
    } else if (selectedId === "__new") {
      setDraft(emptyDraft);
    }
  }, [selectedId, profiles]);

  const createM = useMutation({
    mutationFn: (p: Omit<WebhookProfile, "id">) => api.createProfile(p),
    onSuccess: (p) => {
      toast.success("Profile created");
      setSelectedId(p.id);
      qc.invalidateQueries({ queryKey: ["profiles"] });
    },
  });
  const updateM = useMutation({
    mutationFn: ({ id, p }: { id: string; p: Omit<WebhookProfile, "id"> }) =>
      api.updateProfile(id, p),
    onSuccess: () => {
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["profiles"] });
    },
  });
  const deleteM = useMutation({
    mutationFn: (id: string) => api.deleteProfile(id),
    onSuccess: () => {
      toast.info("Profile deleted");
      setSelectedId(null);
      qc.invalidateQueries({ queryKey: ["profiles"] });
    },
  });
  const testM = useMutation({
    mutationFn: (id: string) => api.testProfile(id),
    onSuccess: (r) => (r.ok ? toast.success(r.message) : toast.error(r.message)),
  });

  const buildPayload = (): Omit<WebhookProfile, "id"> | null => {
    let headers: Record<string, string> = {};
    try {
      headers = draft.headersText.trim() ? JSON.parse(draft.headersText) : {};
    } catch (e) {
      toast.error(`Headers JSON invalid: ${(e as Error).message}`);
      return null;
    }
    try {
      if (draft.payload.trim()) JSON.parse(draft.payload);
    } catch (e) {
      toast.error(`Payload JSON invalid: ${(e as Error).message}`);
      return null;
    }
    if (!draft.name.trim()) {
      toast.error("Name is required.");
      return null;
    }
    if (!draft.url.trim()) {
      toast.error("Webhook URL is required.");
      return null;
    }
    return {
      name: draft.name.trim(),
      url: draft.url.trim(),
      method: draft.method,
      headers,
      payload: draft.payload,
    };
  };

  const handleSave = () => {
    const p = buildPayload();
    if (!p) return;
    if (selectedId && selectedId !== "__new") updateM.mutate({ id: selectedId, p });
    else createM.mutate(p);
  };

  const handleDuplicate = () => {
    const p = buildPayload();
    if (!p) return;
    createM.mutate({ ...p, name: `${p.name} (copy)` });
  };

  const isNew = selectedId === "__new" || !selectedId;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TerminalHeader status={statusQ.data} />

      <main className="mx-auto grid max-w-[1600px] gap-6 px-6 py-8 lg:grid-cols-[320px_1fr]">
        <aside className="panel flex flex-col">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Profiles
            </h2>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedId("__new")}
              className="gap-1"
            >
              <Plus className="h-4 w-4" /> New
            </Button>
          </div>
          <div className="flex flex-col gap-1 p-2">
            {profiles.length === 0 && (
              <div className="p-4 text-center text-xs text-muted-foreground">
                No profiles yet.
              </div>
            )}
            {profiles.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  selectedId === p.id
                    ? "bg-surface-elevated text-foreground"
                    : "text-muted-foreground hover:bg-surface hover:text-foreground",
                )}
              >
                <div className="truncate font-medium">{p.name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {p.method} · {p.url || "no url"}
                </div>
              </button>
            ))}
            {selectedId === "__new" && (
              <div className="mt-1 rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary ring-1 ring-primary/30">
                New profile (unsaved)
              </div>
            )}
          </div>
        </aside>

        <section className="panel p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                {isNew ? "New Webhook Profile" : "Edit Webhook Profile"}
              </h1>
              <p className="text-sm text-muted-foreground">
                Reusable payload templates dispatched by the monitoring engine on trigger.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {!isNew && (
                <>
                  <Button variant="outline" size="sm" onClick={handleDuplicate} className="gap-2">
                    <Copy className="h-4 w-4" /> Duplicate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => selectedId && testM.mutate(selectedId)}
                    disabled={testM.isPending}
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" /> Test
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => selectedId && deleteM.mutate(selectedId)}
                    className="gap-2 text-danger hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                </>
              )}
              <Button size="sm" onClick={handleSave}>
                {isNew ? "Create Profile" : "Save Changes"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Name
              </Label>
              <Input
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder="Long Adjustment"
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                HTTP Method
              </Label>
              <Select
                value={draft.method}
                onValueChange={(v: WebhookProfile["method"]) =>
                  setDraft((d) => ({ ...d, method: v }))
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METHODS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Webhook URL
              </Label>
              <Input
                value={draft.url}
                onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))}
                placeholder="https://example.com/webhook"
                className="tabular"
              />
            </div>
            <div className="md:col-span-2">
              <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Headers (JSON)
              </Label>
              <JsonEditor
                value={draft.headersText}
                onChange={(v) => setDraft((d) => ({ ...d, headersText: v }))}
                rows={6}
              />
            </div>
            <div className="md:col-span-2">
              <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Payload Template (JSON)
              </Label>
              <JsonEditor
                value={draft.payload}
                onChange={(v) => setDraft((d) => ({ ...d, payload: v }))}
                rows={14}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Use placeholders such as{" "}
                <code className="rounded bg-surface px-1 py-0.5 font-mono">{"{{symbol}}"}</code>{" "}
                — the engine interpolates them at trigger time.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
