import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  rows?: number;
}

// Minimal JSON editor with client-side validation. Kept lightweight — no
// external editor dependency. Line numbers + validity indicator.
export function JsonEditor({ value, onChange, className, rows = 14 }: Props) {
  const { valid, error } = useMemo(() => validate(value), [value]);
  const lineCount = value.split("\n").length;

  return (
    <div className={cn("overflow-hidden rounded-lg border border-border bg-surface", className)}>
      <div className="flex items-center justify-between border-b border-border bg-surface-elevated px-3 py-2 text-xs">
        <span className="font-mono uppercase tracking-wide text-muted-foreground">
          JSON Payload
        </span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 font-medium",
            valid
              ? "bg-success/15 text-success ring-1 ring-success/30"
              : "bg-danger/15 text-danger ring-1 ring-danger/30",
          )}
        >
          {valid ? "Valid" : "Invalid"}
        </span>
      </div>
      <div className="grid grid-cols-[auto_1fr]">
        <div
          aria-hidden
          className="tabular select-none border-r border-border bg-surface px-3 py-3 text-right font-mono text-xs leading-6 text-muted-foreground"
        >
          {Array.from({ length: Math.max(lineCount, rows) }).map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <textarea
          value={value}
          spellCheck={false}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          className="w-full resize-y bg-transparent px-3 py-3 font-mono text-sm leading-6 text-foreground outline-none"
        />
      </div>
      {!valid && (
        <div className="border-t border-danger/30 bg-danger/10 px-3 py-2 font-mono text-xs text-danger">
          {error}
        </div>
      )}
    </div>
  );
}

function validate(v: string): { valid: boolean; error?: string } {
  if (!v.trim()) return { valid: true };
  try {
    JSON.parse(v);
    return { valid: true };
  } catch (e) {
    return { valid: false, error: (e as Error).message };
  }
}
