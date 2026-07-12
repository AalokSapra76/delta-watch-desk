// BK Delta Terminal — API client
// Thin HTTP wrapper around the Python monitoring engine. The engine is the
// single source of truth for contracts, monitoring state, delta values,
// triggers and webhook execution. The UI never invents data.

import type {
  Contract,
  EngineStatus,
  Instrument,
  LiveContract,
  WebhookProfile,
} from "./types";

const BASE = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export const isBackendConfigured = BASE.length > 0;

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  if (!isBackendConfigured) {
    throw new Error(
      "Backend not configured. Set VITE_API_BASE_URL to the monitoring engine URL.",
    );
  }
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  // Engine
  getStatus: (): Promise<EngineStatus> => http("/status"),
  start: (): Promise<EngineStatus> => http("/start", { method: "POST" }),
  stop: (): Promise<EngineStatus> => http("/stop", { method: "POST" }),
  pause: (): Promise<EngineStatus> => http("/pause", { method: "POST" }),
  reset: (): Promise<EngineStatus> => http("/reset", { method: "POST" }),

  // Contracts
  getContracts: (): Promise<Contract[]> => http("/contracts"),
  addContract: (c: Omit<Contract, "id">): Promise<Contract> =>
    http("/contracts", { method: "POST", body: JSON.stringify(c) }),
  updateContract: (id: string, c: Omit<Contract, "id">): Promise<Contract> =>
    http(`/contracts/${id}`, { method: "PUT", body: JSON.stringify(c) }),
  deleteContract: (id: string): Promise<void> =>
    http(`/contracts/${id}`, { method: "DELETE" }),

  // Live dashboard
  getDashboard: (): Promise<LiveContract[]> => http("/dashboard"),

  // Instrument / option-chain metadata (from broker via engine)
  getInstruments: (): Promise<Instrument[]> => http("/instruments"),
  getExpiries: (instrument: Instrument): Promise<string[]> =>
    http(`/instruments/${encodeURIComponent(instrument)}/expiries`),
  getStrikes: (instrument: Instrument, expiry: string): Promise<number[]> =>
    http(
      `/instruments/${encodeURIComponent(instrument)}/expiries/${encodeURIComponent(expiry)}/strikes`,
    ),

  // Webhook profiles
  getProfiles: (): Promise<WebhookProfile[]> => http("/profiles"),
  createProfile: (p: Omit<WebhookProfile, "id">): Promise<WebhookProfile> =>
    http("/profiles", { method: "POST", body: JSON.stringify(p) }),
  updateProfile: (id: string, p: Omit<WebhookProfile, "id">): Promise<WebhookProfile> =>
    http(`/profiles/${id}`, { method: "PUT", body: JSON.stringify(p) }),
  deleteProfile: (id: string): Promise<void> =>
    http(`/profiles/${id}`, { method: "DELETE" }),
  testProfile: (id: string): Promise<{ ok: boolean; message: string }> =>
    http(`/profiles/${id}/test`, { method: "POST" }),
};
