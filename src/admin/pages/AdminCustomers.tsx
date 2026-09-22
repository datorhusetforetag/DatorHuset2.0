import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
  Search,
  ShoppingBag,
  UserRound,
} from "lucide-react";

import { AdminAccessContext } from "../useAdminAccess";
import { errorMessage } from "@/lib/utils";

/**
 * Kunderna.
 *
 * Finns för samtalet: någon hör av sig om sin order, sitt lösenord eller
 * sin leverans, och då ska personen och hennes ordrar stå på samma sida.
 * Att leta i en kundlista och sedan i en orderlista, med ett id i
 * huvudet emellan, är hur man svarar fel.
 *
 * LISTAN ÄR SMAL MED FLIT
 *
 * Namn, adress, antal ordrar. Adresser, telefonnummer och orderrader
 * hämtas först när man öppnar en kund. Det är personuppgifter, och att
 * visa allt om alla samtidigt är att lämna dem framme i onödan - varje
 * öppnad kund loggas dessutom i revisionsloggen.
 *
 * LÖSENORD ÅTERSTÄLLS ALDRIG ÅT NÅGON
 *
 * Knappen skickar ett mejl till kundens egen adress. Vi sätter aldrig
 * ett lösenord själva: den som ringer måste ha tillgång till inkorgen
 * för att komma vidare, annars hade ett telefonsamtal räckt för att ta
 * över ett konto.
 */

type Customer = {
  id: string;
  email: string | null;
  name: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
  email_confirmed: boolean;
  orders: number;
  open_orders: number;
  spent_cents: number;
};

type OrderItem = {
  quantity: number;
  unit_price_cents: number;
  product?: { name?: string } | null;
};

type CustomerOrder = {
  id: string;
  order_number?: string | number | null;
  status?: string | null;
  total_cents?: number | null;
  created_at?: string | null;
  tracking_url?: string | null;
  shipping_carrier?: string | null;
  tracking_number?: string | null;
  order_items?: OrderItem[];
};

type CustomerDetail = Customer & {
  phone: string | null;
  provider: string | null;
  addresses: Record<string, unknown>[];
  orders: CustomerOrder[];
};

const CLOSED_STATUSES = ["delivered", "cancelled", "refunded"];

const kr = (cents?: number | null) =>
  `${Math.round((Number(cents) || 0) / 100).toLocaleString("sv-SE")} kr`;

const date = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("sv-SE") : "-";

export default function AdminCustomers() {
  const { token, apiBase, role } = useOutletContext<AdminAccessContext>();
  const canWrite = role === "admin" || role === "ops";

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiBase}/api/admin/v2/customers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error?.message || payload?.error || "Kunde inte hämta kunderna.");
      }
      setCustomers(Array.isArray(payload?.data) ? payload.data : []);
    } catch (loadError) {
      setError(errorMessage(loadError, "Kunde inte hämta kunderna."));
    } finally {
      setLoading(false);
    }
  }, [apiBase, token]);

  useEffect(() => {
    if (token) void load();
  }, [token, load]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    const rows = term
      ? customers.filter((customer) =>
          [customer.email, customer.name].some((field) =>
            String(field || "").toLowerCase().includes(term),
          ),
        )
      : customers;
    /* Den som har en order på gång är den som ringer. */
    return [...rows].sort((a, b) => {
      if (a.open_orders !== b.open_orders) return b.open_orders - a.open_orders;
      return String(b.created_at || "").localeCompare(String(a.created_at || ""));
    });
  }, [customers, query]);

  if (openId) {
    return (
      <CustomerPanel
        apiBase={apiBase}
        token={token}
        canWrite={canWrite}
        userId={openId}
        onBack={() => setOpenId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Kunder</h2>
          <p className="mt-1 text-sm text-slate-400">
            {customers.length} konton ·{" "}
            {customers.filter((c) => c.open_orders > 0).length} med pågående order
          </p>
        </div>
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Sök namn eller e-post"
            className="w-64 rounded-lg border border-slate-700/60 bg-slate-950/60 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none"
          />
        </label>
      </header>

      {error && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          <span>{error}</span>
          <button type="button" onClick={() => void load()} className="font-semibold underline">
            Försök igen
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 px-6 py-12 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Hämtar kunder...
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 px-6 py-16 text-center">
          <UserRound className="mx-auto h-8 w-8 text-slate-600" />
          <p className="mt-4 font-semibold text-slate-200">
            {query ? "Ingen kund matchar sökningen" : "Inga kunder än"}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
          {visible.map((customer) => (
            <button
              key={customer.id}
              type="button"
              onClick={() => setOpenId(customer.id)}
              className="flex w-full items-center gap-4 border-b border-slate-800/70 px-4 py-3 text-left last:border-b-0 hover:bg-slate-800/30"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-300">
                {(customer.name || customer.email || "?").slice(0, 1).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-100">
                  {customer.name || "Utan namn"}
                </p>
                <p className="truncate text-xs text-slate-500">{customer.email || "Ingen adress"}</p>
              </div>

              {customer.open_orders > 0 && (
                <span className="shrink-0 rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold text-amber-200">
                  {customer.open_orders} pågående
                </span>
              )}

              <span className="hidden w-24 shrink-0 text-right text-xs text-slate-500 sm:block">
                {customer.orders} {customer.orders === 1 ? "order" : "ordrar"}
              </span>

              <span className="hidden w-24 shrink-0 text-right text-sm font-semibold tabular-nums text-slate-300 lg:block">
                {kr(customer.spent_cents)}
              </span>

              <span className="hidden w-24 shrink-0 text-right text-xs text-slate-600 xl:block">
                {date(customer.created_at)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const CustomerPanel = ({
  apiBase,
  token,
  canWrite,
  userId,
  onBack,
}: {
  apiBase: string;
  token: string;
  canWrite: boolean;
  userId: string;
  onBack: () => void;
}) => {
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resetState, setResetState] = useState<"idle" | "sending" | "sent">("idle");

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`${apiBase}/api/admin/v2/customers/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload?.error?.message || payload?.error || "Kunde inte hämta kunden.");
        }
        if (active) setCustomer(payload.data);
      })
      .catch((loadError) => {
        if (active) setError(errorMessage(loadError, "Kunde inte hämta kunden."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [apiBase, token, userId]);

  const sendReset = async () => {
    if (!customer?.email) return;
    const confirmed = window.confirm(
      `Skicka återställningslänk till ${customer.email}?\n\n` +
        "Mejlet går till kundens egen adress. Du sätter inget lösenord åt " +
        "kunden - hon måste själv öppna länken.",
    );
    if (!confirmed) return;

    setResetState("sending");
    setError("");
    try {
      const response = await fetch(`${apiBase}/api/admin/v2/customers/${userId}/reset-password`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error?.message || payload?.error || "Kunde inte skicka mejlet.");
      }
      setResetState("sent");
    } catch (resetError) {
      setError(errorMessage(resetError, "Kunde inte skicka mejlet."));
      setResetState("idle");
    }
  };

  const open = (customer?.orders || []).filter(
    (order) => !CLOSED_STATUSES.includes(String(order.status || "")),
  );
  const closed = (customer?.orders || []).filter((order) =>
    CLOSED_STATUSES.includes(String(order.status || "")),
  );

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Alla kunder
      </button>

      {error && (
        <p role="alert" className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 px-6 py-12 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Hämtar kunden...
        </div>
      ) : customer ? (
        <>
          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {customer.name || "Utan namn"}
                </h2>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    {customer.email || "Ingen adress"}
                  </span>
                  {customer.email_confirmed && (
                    <span className="inline-flex items-center gap-1 text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      bekräftad
                    </span>
                  )}
                </p>
              </div>

              {canWrite && customer.email && (
                <button
                  type="button"
                  onClick={() => void sendReset()}
                  disabled={resetState !== "idle"}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-cyan-400/60 hover:text-cyan-300 disabled:opacity-60"
                >
                  {resetState === "sending" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <KeyRound className="h-4 w-4" />
                  )}
                  {resetState === "sent" ? "Mejl skickat" : "Skicka återställningslänk"}
                </button>
              )}
            </div>

            <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <Fact label="Konto skapat" value={date(customer.created_at)} />
              <Fact label="Senast inloggad" value={date(customer.last_sign_in_at)} />
              <Fact label="Inloggning via" value={customer.provider || "e-post"} />
              <Fact label="Telefon" value={customer.phone || "-"} />
            </dl>

            {customer.addresses.length > 0 && (
              <div className="mt-6 border-t border-slate-800 pt-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Adresser
                </p>
                <div className="mt-2 space-y-1 text-sm text-slate-400">
                  {customer.addresses.map((address, index) => (
                    <p key={index}>
                      {[address.address, address.postal_code, address.city]
                        .map((part) => String(part || "").trim())
                        .filter(Boolean)
                        .join(", ") || "Ofullständig adress"}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </section>

          <OrderList title="Pågående ordrar" orders={open} empty="Inga pågående ordrar." />
          <OrderList title="Avslutade ordrar" orders={closed} empty="Inga avslutade ordrar än." />
        </>
      ) : null}
    </div>
  );
};

const Fact = ({ label, value }: { label: string; value: string }) => (
  <div>
    <dt className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</dt>
    <dd className="mt-1 text-slate-300">{value}</dd>
  </div>
);

const OrderList = ({
  title,
  orders,
  empty,
}: {
  title: string;
  orders: CustomerOrder[];
  empty: string;
}) => (
  <section>
    <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-slate-300">
      {title}
      <span className="ml-2 font-normal normal-case tracking-normal text-slate-500">
        {orders.length}
      </span>
    </h3>

    {orders.length === 0 ? (
      <p className="rounded-2xl border border-slate-800 bg-slate-900/40 px-6 py-6 text-sm text-slate-500">
        {empty}
      </p>
    ) : (
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
        {orders.map((order) => (
          <div key={order.id} className="border-b border-slate-800/70 px-4 py-3 last:border-b-0">
            <div className="flex flex-wrap items-center gap-3">
              <ShoppingBag className="h-4 w-4 shrink-0 text-slate-600" />
              <span className="text-sm font-semibold text-slate-200">
                #{order.order_number ?? String(order.id).slice(0, 8)}
              </span>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-300">
                {order.status || "okänd"}
              </span>
              <span className="text-xs text-slate-500">{date(order.created_at)}</span>
              <span className="ml-auto text-sm font-semibold tabular-nums text-slate-200">
                {kr(order.total_cents)}
              </span>
            </div>

            <p className="mt-1.5 pl-7 text-xs text-slate-500">
              {(order.order_items || [])
                .map((item) => `${item.product?.name || "Produkt"} x${item.quantity}`)
                .join(", ") || "Inga rader"}
            </p>

            {order.tracking_url && (
              <a
                href={order.tracking_url}
                target="_blank"
                rel="noreferrer"
                className="mt-1.5 inline-block pl-7 text-xs font-semibold text-cyan-300 hover:underline"
              >
                Spåra {order.shipping_carrier || "paketet"}
                {order.tracking_number ? ` (${order.tracking_number})` : ""}
              </a>
            )}
          </div>
        ))}
      </div>
    )}
  </section>
);
