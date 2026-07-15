// BK Delta Terminal — types shared across UI and API client
//
// These names match the canonical snake_case dict keys that the Python
// monitoring engine (main.py) and console source (contract_source/console.py)
// read and write. No translation layer.

export type Instrument = string;
export type OptionType = "CE" | "PE";
// Engine (main.py threshold_crossed) only supports these two directions;
// anything else raises ValueError at runtime.
export type TriggerDirection = ">" | "<";
export type MonitoringState = "stopped" | "running" | "paused" | "idle";
export type ContractStatus =
  | "monitoring"
  | "triggered"
  | "disconnected"
  | "idle";

export interface WebhookProfile {
  id: string;
  name: string;
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers: Record<string, string>;
  payload: string; // JSON string
}

export interface Contract {
  id: string;
  instrument: Instrument;
  expiry: string;
  strike: number;
  option_type: OptionType;
  trigger_direction: TriggerDirection;
  delta_threshold: number;
  webhook_profile_id: string;
}

export interface LiveContract extends Contract {
  spot: number | null;
  premium: number | null;
  current_delta: number | null;
  status: ContractStatus;
  triggered: boolean;
  last_updated: number | null;
}

export interface EngineStatus {
  state: MonitoringState;
  connected: boolean;
  broker: "kite" | null;
  message?: string;
}
