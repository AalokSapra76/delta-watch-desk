import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";

import { TerminalHeader } from "@/components/terminal/TerminalHeader";
import { ContractBuilder } from "@/components/terminal/ContractBuilder";
import { ContractsTable } from "@/components/terminal/ContractsTable";
import { MonitoringControls } from "@/components/terminal/MonitoringControls";
import { MonitoringDashboard } from "@/components/terminal/MonitoringDashboard";
import { Button } from "@/components/ui/button";

import { api, isMockMode } from "@/lib/terminal/api";
import type { Contract, WebhookProfile } from "@/lib/terminal/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BK Delta Terminal — Live Option Delta Monitor" },
      {
        name: "description",
        content:
          "Professional trading terminal for configuring and monitoring multiple option contracts with real-time delta triggers and webhook alerts.",
      },
      { property: "og:title", content: "BK Delta Terminal" },
      {
        property: "og:description",
        content: "Configure, monitor and alert on option delta triggers.",
      },
    ],
  }),
  component: TerminalPage,
});

function TerminalPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Contract | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const statusQ = useQuery({ queryKey: ["status"], queryFn: api.getStatus, refetchInterval: 5000 });
  const contractsQ = useQuery({ queryKey: ["contracts"], queryFn: api.getContracts });
  const profilesQ = useQuery({ queryKey: ["profiles"], queryFn: api.getProfiles });

  const running = statusQ.data?.state === "running";

  const liveQ = useQuery({
    queryKey: ["dashboard"],
    queryFn: api.getDashboard,
    enabled: statusQ.data?.state !== "idle",
    refetchInterval: running ? 1500 : false,
  });

  useEffect(() => {
    if (statusQ.data?.state === "idle") qc.setQueryData(["dashboard"], []);
  }, [statusQ.data?.state, qc]);

  const addM = useMutation({
    mutationFn: (c: Omit<Contract, "id">) => api.addContract(c),
    onSuccess: () => {
      toast.success("Contract added");
      qc.invalidateQueries({ queryKey: ["contracts"] });
    },
  });
  const updateM = useMutation({
    mutationFn: ({ id, c }: { id: string; c: Omit<Contract, "id"> }) =>
      api.updateContract(id, c),
    onSuccess: () => {
      toast.success("Contract updated");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["contracts"] });
    },
  });
  const deleteM = useMutation({
    mutationFn: (id: string) => api.deleteContract(id),
    onSuccess: () => {
      toast.success("Contract removed");
      qc.invalidateQueries({ queryKey: ["contracts"] });
    },
  });

  const startM = useMutation({
    mutationFn: api.start,
    onSuccess: () => {
      toast.success("Monitoring started");
      qc.invalidateQueries({ queryKey: ["status"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
  const stopM = useMutation({
    mutationFn: api.stop,
    onSuccess: () => {
      toast.info("Monitoring stopped");
      qc.invalidateQueries({ queryKey: ["status"] });
    },
  });
  const pauseM = useMutation({
    mutationFn: api.pause,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["status"] }),
  });
  const resetM = useMutation({
    mutationFn: api.reset,
    onSuccess: () => {
      toast.info("Engine reset");
      qc.invalidateQueries({ queryKey: ["status"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const contracts = contractsQ.data ?? [];
  const profiles = profilesQ.data ?? [];
  const live = liveQ.data ?? [];

  const canStart = contracts.length > 0;

  const handleSubmit = (c: Omit<Contract, "id">) => {
    if (editing) updateM.mutate({ id: editing.id, c });
    else addM.mutate(c);
  };

  const exportConfig = () => {
    const blob = new Blob(
      [JSON.stringify({ contracts, profiles }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bk-delta-config-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importConfig = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as {
        contracts?: Contract[];
        profiles?: WebhookProfile[];
      };
      if (Array.isArray(parsed.profiles)) {
        for (const p of parsed.profiles) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id: _id, ...rest } = p;
          await api.createProfile(rest);
        }
      }
      if (Array.isArray(parsed.contracts)) {
        for (const c of parsed.contracts) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id: _id, ...rest } = c;
          await api.addContract(rest);
        }
      }
      toast.success("Configuration loaded");
      qc.invalidateQueries({ queryKey: ["contracts"] });
      qc.invalidateQueries({ queryKey: ["profiles"] });
    } catch (e) {
      toast.error(`Import failed: ${(e as Error).message}`);
    }
  };

  const showDashboard = useMemo(
    () => statusQ.data?.state && statusQ.data.state !== "idle",
    [statusQ.data?.state],
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TerminalHeader status={statusQ.data} />

      {isMockMode && (
        <div className="border-b border-warning/30 bg-warning/10 px-6 py-2 text-center text-xs text-warning">
          Running in mock mode — set{" "}
          <code className="font-mono">VITE_API_BASE_URL</code> to connect the
          monitoring engine.
        </div>
      )}

      <main className="mx-auto flex max-w-[1600px] flex-col gap-6 px-6 py-8">
        <ContractBuilder
          profiles={profiles}
          editing={editing}
          onSubmit={handleSubmit}
          onCancelEdit={() => setEditing(null)}
        />

        <div className="flex flex-wrap items-center justify-end gap-2">
          <input
            ref={importRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importConfig(f);
              e.target.value = "";
            }}
          />
          <Button variant="outline" size="sm" onClick={() => importRef.current?.click()} className="gap-2">
            <Upload className="h-4 w-4" /> Load Config
          </Button>
          <Button variant="outline" size="sm" onClick={exportConfig} className="gap-2">
            <Download className="h-4 w-4" /> Save Config
          </Button>
        </div>

        <ContractsTable
          contracts={contracts}
          profiles={profiles}
          onEdit={setEditing}
          onDelete={(c) => deleteM.mutate(c.id)}
        />

        <MonitoringControls
          status={statusQ.data}
          canStart={canStart}
          onStart={() => startM.mutate()}
          onStop={() => stopM.mutate()}
          onPause={() => pauseM.mutate()}
          onReset={() => resetM.mutate()}
        />

        {showDashboard && <MonitoringDashboard live={live} />}
      </main>
    </div>
  );
}
