const STORAGE_KEY = "office-energy-cost-per-kwh";
const DEFAULT_COST_BDT = 8.19;

export const getCostPerKwh = (): number => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      const parsed = Number(stored);
      if (!Number.isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
  } catch {
    // localStorage may be unavailable
  }
  return DEFAULT_COST_BDT;
};

export const setCostPerKwh = (value: number): void => {
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // localStorage may be unavailable
  }
};

export const DEFAULT_COST_PER_KWH = DEFAULT_COST_BDT;
