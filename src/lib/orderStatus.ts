export type OrderStatusInfo = {
  value: string;
  label: string;
  eta: string;
  step: number;
};

export const ORDER_STATUS_FLOW: OrderStatusInfo[] = [
  { value: "received", label: "Beställning mottagen", eta: "1-2 dagar", step: 1 },
  { value: "building", label: "Bygger/Produktion", eta: "1-3 dagar", step: 2 },
  { value: "postbuild", label: "Post-bygg justeringar", eta: "1-2 dagar", step: 3 },
  { value: "ready", label: "Redo att hämta/frakta!", eta: "Kontakta kund", step: 4 },
];

const STATUS_ALIASES: Record<string, string> = {
  pending: "received",
  ordering: "received",
  in_progress: "building",
  finished: "ready",
  completed: "ready",
  cancel_requested: "received",
};

export const getOrderStatusInfo = (status?: string) => {
  const normalized = status ? STATUS_ALIASES[status] || status : "received";
  return ORDER_STATUS_FLOW.find((item) => item.value === normalized) || ORDER_STATUS_FLOW[0];
};

export const ORDER_STATUS_STEPS = ORDER_STATUS_FLOW.map((step) => step.label);

