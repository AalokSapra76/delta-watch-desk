// BK Delta Terminal — types shared across UI and API client
// Instrument identifiers are supplied by the backend (broker instrument
// master). Do not hardcode a fixed union — the engine is the source of truth.
export type Instrument = string;
export type OptionType = "CE" | "PE";
export type Condition = "<" | "<=" | ">" | ">=" | "=";
export type MonitoringState = "idle" | "running" | "paused";
export type ContractStatus = "monitoring" | "triggered" | "disconnected" | "idle";

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
  optionType: OptionType;
  condition: Condition;
  threshold: number;
  webhookProfileId: string;
}

export interface LiveContract extends Contract {
  spot: number | null;
  premium: number | null;
  currentDelta: number | null;
  status: ContractStatus;
  triggered: boolean;
  lastUpdated: number | null;
}

export interface EngineStatus {
  state: MonitoringState;
  connected: boolean;
  broker: "kite" | null;
  message?: string;
}
