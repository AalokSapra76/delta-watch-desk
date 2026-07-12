// Static option chain metadata for the Contract Builder dropdowns.
// The engine remains the source of truth; this only powers UI selection.
import type { Instrument } from "./types";

export const INSTRUMENTS: Instrument[] = ["NIFTY", "BANKNIFTY", "FINNIFTY"];

function nextThursdays(count: number): string[] {
  const out: string[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  while (out.length < count) {
    if (d.getDay() === 4 && d.getTime() > Date.now()) {
      out.push(d.toISOString().slice(0, 10));
    }
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export const EXPIRIES: string[] = nextThursdays(6);

const STRIKE_STEP: Record<Instrument, number> = {
  NIFTY: 50,
  BANKNIFTY: 100,
  FINNIFTY: 50,
};

const ATM: Record<Instrument, number> = {
  NIFTY: 24350,
  BANKNIFTY: 48200,
  FINNIFTY: 22150,
};

export function strikesFor(inst: Instrument): number[] {
  const step = STRIKE_STEP[inst];
  const atm = Math.round(ATM[inst] / step) * step;
  const out: number[] = [];
  for (let i = -20; i <= 20; i++) out.push(atm + i * step);
  return out;
}
