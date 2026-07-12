// BK Delta Terminal — API client
// The Python monitoring engine exposes an HTTP wrapper. When
// VITE_API_BASE_URL is set, all methods hit the real backend. Otherwise a
// deterministic local mock persists in localStorage so the UI is usable
// during development and demos. NO trading logic runs in the UI.

import type {
  Contract,
  EngineStatus,
  LiveContract,
  WebhookProfile,
} from "./types";

const BASE = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
const USE_MOCK = !BASE;

// ---------- LocalStorage-backed mock store ----------
const LS = {
  contracts: "bkdt.contracts",
  profiles: "bkdt.profiles",
  status: "bkdt.status",
  live: "bkdt.live",
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function seedProfiles(): WebhookProfile[] {
  return [
    {
      id: uid(),
      name: "Long Adjustment",
      url: "https://example.com/webhook/long-adjustment",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      payload: JSON.stringify(
        { action: "adjust", strategy: "long", contract: "{{symbol}}" },
        null,
        2,
      ),
    },
    {
      id: uid(),
      name: "Iron Fly Adjustment",
      url: "https://example.com/webhook/iron-fly",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      payload: JSON.stringify(
        { action: "adjust", strategy: "iron_fly", contract: "{{symbol}}" },
        null,
        2,
      ),
    },
  ];
}

function ensureSeed() {
  if (typeof window === "undefined") return;
  if (!window.localStorage.getItem(LS.profiles)) write(LS.profiles, seedProfiles());
  if (!window.localStorage.getItem(LS.contracts)) write(LS.contracts, []);
  if (!window.localStorage.getItem(LS.status))
    write(LS.status, { state: "idle", connected: false, broker: null } as EngineStatus);
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

// ---------- Public API ----------
export const api = {
  async getStatus(): Promise<EngineStatus> {
    if (!USE_MOCK) return http("/status");
    ensureSeed();
    return read<EngineStatus>(LS.status, { state: "idle", connected: false, broker: null });
  },

  async getContracts(): Promise<Contract[]> {
    if (!USE_MOCK) return http("/contracts");
    ensureSeed();
    return read<Contract[]>(LS.contracts, []);
  },

  async addContract(c: Omit<Contract, "id">): Promise<Contract> {
    if (!USE_MOCK) return http("/contracts", { method: "POST", body: JSON.stringify(c) });
    const list = read<Contract[]>(LS.contracts, []);
    const created: Contract = { ...c, id: uid() };
    write(LS.contracts, [...list, created]);
    return created;
  },

  async updateContract(id: string, c: Omit<Contract, "id">): Promise<Contract> {
    if (!USE_MOCK)
      return http(`/contracts/${id}`, { method: "PUT", body: JSON.stringify(c) });
    const list = read<Contract[]>(LS.contracts, []);
    const next = list.map((x) => (x.id === id ? { ...c, id } : x));
    write(LS.contracts, next);
    return { ...c, id };
  },

  async deleteContract(id: string): Promise<void> {
    if (!USE_MOCK) {
      await http(`/contracts/${id}`, { method: "DELETE" });
      return;
    }
    const list = read<Contract[]>(LS.contracts, []);
    write(
      LS.contracts,
      list.filter((c) => c.id !== id),
    );
  },

  async start(): Promise<EngineStatus> {
    if (!USE_MOCK) return http("/start", { method: "POST" });
    const s: EngineStatus = { state: "running", connected: true, broker: "kite" };
    write(LS.status, s);
    return s;
  },
  async stop(): Promise<EngineStatus> {
    if (!USE_MOCK) return http("/stop", { method: "POST" });
    const s: EngineStatus = { state: "idle", connected: false, broker: null };
    write(LS.status, s);
    write(LS.live, []);
    return s;
  },
  async pause(): Promise<EngineStatus> {
    if (!USE_MOCK) return http("/pause", { method: "POST" });
    const cur = read<EngineStatus>(LS.status, { state: "idle", connected: false, broker: null });
    const s: EngineStatus = { ...cur, state: "paused" };
    write(LS.status, s);
    return s;
  },
  async reset(): Promise<EngineStatus> {
    if (!USE_MOCK) return http("/reset", { method: "POST" });
    write(LS.live, []);
    const s: EngineStatus = { state: "idle", connected: false, broker: null };
    write(LS.status, s);
    return s;
  },

  async getDashboard(): Promise<LiveContract[]> {
    if (!USE_MOCK) return http("/dashboard");
    // MOCK: derive a simulated live view from configured contracts + status.
    const contracts = read<Contract[]>(LS.contracts, []);
    const status = read<EngineStatus>(LS.status, { state: "idle", connected: false, broker: null });
    if (status.state === "idle") return [];
    const prev = read<LiveContract[]>(LS.live, []);
    const now = Date.now();
    const live: LiveContract[] = contracts.map((c) => {
      const p = prev.find((x) => x.id === c.id);
      // Random walk simulation — cosmetic only.
      const drift = (Math.random() - 0.5) * 0.02;
      const currentDelta =
        p?.currentDelta != null
          ? clamp(p.currentDelta + drift, -1, 1)
          : c.optionType === "CE"
            ? 0.5
            : -0.5;
      const spot = p?.spot ?? seedSpot(c.instrument);
      const premium = Math.max(0, (p?.premium ?? 120) + (Math.random() - 0.5) * 4);
      const triggered =
        p?.triggered || evalCondition(currentDelta, c.condition, c.threshold);
      return {
        ...c,
        spot,
        premium,
        currentDelta,
        status: status.state === "paused" ? "idle" : triggered ? "triggered" : "monitoring",
        triggered,
        lastUpdated: now,
      };
    });
    write(LS.live, live);
    return live;
  },

  // Webhook profiles
  async getProfiles(): Promise<WebhookProfile[]> {
    if (!USE_MOCK) return http("/profiles");
    ensureSeed();
    return read<WebhookProfile[]>(LS.profiles, []);
  },
  async createProfile(p: Omit<WebhookProfile, "id">): Promise<WebhookProfile> {
    if (!USE_MOCK) return http("/profiles", { method: "POST", body: JSON.stringify(p) });
    const list = read<WebhookProfile[]>(LS.profiles, []);
    const created: WebhookProfile = { ...p, id: uid() };
    write(LS.profiles, [...list, created]);
    return created;
  },
  async updateProfile(id: string, p: Omit<WebhookProfile, "id">): Promise<WebhookProfile> {
    if (!USE_MOCK) return http(`/profiles/${id}`, { method: "PUT", body: JSON.stringify(p) });
    const list = read<WebhookProfile[]>(LS.profiles, []);
    const next = list.map((x) => (x.id === id ? { ...p, id } : x));
    write(LS.profiles, next);
    return { ...p, id };
  },
  async deleteProfile(id: string): Promise<void> {
    if (!USE_MOCK) {
      await http(`/profiles/${id}`, { method: "DELETE" });
      return;
    }
    const list = read<WebhookProfile[]>(LS.profiles, []);
    write(LS.profiles, list.filter((p) => p.id !== id));
  },
  async testProfile(id: string): Promise<{ ok: boolean; message: string }> {
    if (!USE_MOCK) return http(`/profiles/${id}/test`, { method: "POST" });
    return { ok: true, message: "Mock: webhook payload validated locally." };
  },
};

// helpers
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function seedSpot(inst: string) {
  return inst === "BANKNIFTY" ? 48250 : inst === "FINNIFTY" ? 22150 : 24350;
}
function evalCondition(v: number, op: string, t: number) {
  switch (op) {
    case "<": return v < t;
    case "<=": return v <= t;
    case ">": return v > t;
    case ">=": return v >= t;
    case "=": return Math.abs(v - t) < 0.005;
    default: return false;
  }
}

export const isMockMode = USE_MOCK;
