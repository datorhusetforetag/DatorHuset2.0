export const USED_PART_KEYS = [
  "cpu",
  "gpu",
  "ram",
  "storage",
  "motherboard",
  "psu",
  "case_name",
  "cpu_cooler",
] as const;

export type UsedPartKey = (typeof USED_PART_KEYS)[number];

export type UsedPartsSettings = Record<UsedPartKey, boolean>;

export const USED_PART_LABELS: Record<UsedPartKey, string> = {
  cpu: "CPU",
  gpu: "GPU",
  ram: "RAM",
  storage: "Lagring",
  motherboard: "Moderkort",
  psu: "PSU",
  case_name: "Chassi",
  cpu_cooler: "CPU-kylare",
};

export const DEFAULT_USED_PARTS_SETTINGS: UsedPartsSettings = {
  cpu: false,
  gpu: false,
  ram: false,
  storage: false,
  motherboard: false,
  psu: false,
  case_name: false,
  cpu_cooler: false,
};

export const sanitizeUsedPartsSettings = (input: unknown): UsedPartsSettings => {
  const source = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const next = { ...DEFAULT_USED_PARTS_SETTINGS };
  USED_PART_KEYS.forEach((key) => {
    next[key] = Boolean(source[key]);
  });
  return next;
};
