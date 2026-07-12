import { Pause, Play, RotateCcw, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EngineStatus } from "@/lib/terminal/types";

interface Props {
  status: EngineStatus | undefined;
  canStart: boolean;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onReset: () => void;
}

export function MonitoringControls({ status, canStart, onStart, onStop, onPause, onReset }: Props) {
  const state = status?.state ?? "idle";
  const running = state === "running";
  const paused = state === "paused";

  return (
    <section className="panel p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Monitoring Controls</h2>
          <p className="text-sm text-muted-foreground">
            Command the monitoring engine. Trading logic runs server-side.
          </p>
        </div>
        <div className="tabular text-xs text-muted-foreground">
          Engine state · <span className="font-medium uppercase text-foreground">{state}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Button
          size="lg"
          onClick={onStart}
          disabled={running || !canStart}
          className="h-14 gap-2 bg-success text-success-foreground hover:bg-success/90"
        >
          <Play className="h-5 w-5" />
          Start Monitoring
        </Button>
        <Button
          size="lg"
          onClick={onStop}
          disabled={state === "idle"}
          variant="destructive"
          className="h-14 gap-2"
        >
          <Square className="h-5 w-5" />
          Stop Monitoring
        </Button>
        <Button
          size="lg"
          onClick={onPause}
          disabled={!running && !paused}
          variant="outline"
          className="h-14 gap-2"
        >
          <Pause className="h-5 w-5" />
          {paused ? "Resume" : "Pause"}
        </Button>
        <Button
          size="lg"
          onClick={onReset}
          variant="outline"
          className="h-14 gap-2"
        >
          <RotateCcw className="h-5 w-5" />
          Reset
        </Button>
      </div>
    </section>
  );
}
