import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Archive,
  ChevronDown,
  ChevronRight,
  Loader2,
  RotateCcw,
  Search,
  Truck,
} from "lucide-react";

import { AdminAccessContext } from "../useAdminAccess";
import { errorMessage } from "@/lib/utils";
import { readApiError } from "../apiError";
import { CARRIER_LABELS, getOrderStatusInfo, resolveTrackingUrl } from "@/lib/orderStatus";

/**
 * Arkiv beställningar.
 *
 * Beställningslistan töms aldrig av sig själv. En order som levererades
 * i mars kräver ingenting av någon, men den ligger kvar mellan de tre
 * som faktiskt ska byggas den här veckan. Efter ett år är listan mest
 * historik, och dagens arbete syns inte längre i den.
 *
 * Här hamnar det som är klart. Ingenting raderas - kunden ser sin order
 * som vanligt, kvittot fungerar, och raden finns kvar i databasen.
 *
 * Sidan är byggd för att slå upp i, inte arbeta i. Därför står
 * sökningen först, och därför söker den också på serienummer: kommer en
 * maskin tillbaka med ett garantiärende är numret på chassit det enda
 * man har att gå på, och "vem köpte den här, och när?" är precis vad
 * ett arkiv ska kunna svara på.
 */

type ArchivedItem = {
  id: string;
  quantity: number;
  unit_price_cents?: number | null;
  serial_number?: string | null;
  build_notes?: string | null;
  product?: { name?: string | null } | null;
};

type ArchivedOrder = {
  id: string;
  status?: string | null;
  total_cents?: number | null;
  created_at?: string | null;
  archived_at?: string | null;
  cancelled_at?: string | null;
  cancel_reason?: string | null;
  order_number?: string | number | null;
  order_reference?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  receipt_url?: string | null;
  shipping_carrier?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
  order_items?: ArchivedItem[];
};

const formatCurrency = (cents?: number | null) =>
  new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK" }).format((cents || 0) / 100);

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("sv-SE") : "-";

/* Samma ordning som kunden ser: referensen först, löpnumret om den
   saknas. Ringer någon och läser upp "DH-1004-K7M" ska det gå att hitta
   utan att först översätta det till ett internt nummer. */
const displayNumber = (order: ArchivedOrder) =>
  order.order_reference ||
  (order.order_number === null || order.order_number === undefined || order.order_number === ""
    ? order.id.slice(0, 8)
    : String(order.order_number));

/* Avbrutna ordrar finns inte i ORDER_STATUS_FLOW - de är slut på vägen,
   inte ett steg på den - så de får sin etikett här. */
const statusLabel = (order: ArchivedOrder) => {
  const raw = String(order.status || "");
  if (raw === "cancelled") return "Avbruten";
  if (raw === "refunded") return "Återbetald";
  return getOrderStatusInfo(raw || undefined).label;
};

export default function AdminOrdersArchive() {
  const { token, apiBase, role } = useOutletContext<AdminAccessContext>();
  const canWrite = role === "admin" || role === "ops";

  const [orders, setOrders] = useState<ArchivedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiBase}/api/admin/v2/orders?archived=true&limit=200`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(await readApiError(response, "Kunde inte hämta arkivet."));
      }
      const payload = await response.json().catch(() => ({}));
      setOrders(Array.isArray(payload?.data) ? payload.data : []);
    } catch (loadError) {
      setError(errorMessage(loadError, "Kunde inte hämta arkivet."));
    } finally {
      setLoading(false);
    }
  }, [apiBase, token]);

  useEffect(() => {
    if (token) void load();
  }, [token, load]);

  /* Sökningen sker här och inte på servern. Serienumret sitter på
     orderraden och inte på ordern, så en ilike i samma fråga hade inte
     nått det. Arkivet är dessutom litet nog att rymmas i minnet - och
     blir det inte det syns det på raden längst ned. */
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return orders;
    return orders.filter((order) => {
      const haystack = [
        displayNumber(order),
        order.customer_name,
        order.customer_email,
        order.customer_phone,
        order.tracking_number,
        ...(order.order_items || []).flatMap((item) => [item.product?.name, item.serial_number]),
      ];
      return haystack.some((field) => String(field || "").toLowerCase().includes(term));
    });
  }, [orders, query]);

  const restore = useCallback(
    async (order: ArchivedOrder) => {
      const confirmed = window.confirm(
        `Hämta tillbaka order ${displayNumber(order)}?\n\n` +
          "Den läggs tillbaka i Beställningar med samma status som nu.",
      );
      if (!confirmed) return;

      setBusyId(order.id);
      setError("");
      try {
        const response = await fetch(`${apiBase}/api/admin/v2/orders/${order.id}/arkiv`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ archived: false }),
        });
        if (!response.ok) {
          throw new Error(await readApiError(response, "Kunde inte hämta tillbaka beställningen."));
        }
        setOrders((prev) => prev.filter((row) => row.id !== order.id));
      } catch (restoreError) {
        setError(errorMessage(restoreError, "Kunde inte hämta tillbaka beställningen."));
      } finally {
        setBusyId(null);
      }
    },
    [apiBase, token],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Arkiv beställningar</h2>
          <p className="mt-1 max-w-xl text-sm text-slate-400">
            Avslutade ordrar, undanflyttade men inte raderade. Sök på ordernummer, kund
            eller serienummer.
          </p>
        </div>

        {orders.length > 0 && (
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ordernr, namn, mejl, serienummer"
              className="w-72 rounded-lg border border-slate-700/60 bg-slate-950/60 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none"
            />
          </label>
        )}
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
          Hämtar arkivet...
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 px-6 py-16 text-center">
          <Archive className="mx-auto h-8 w-8 text-slate-600" />
          <p className="mt-4 font-semibold text-slate-200">
            {query ? "Inget i arkivet matchar sökningen" : "Arkivet är tomt"}
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
            {query
              ? "Prova ett annat ord, eller en del av ett serienummer."
              : "Ordrar hamnar här när du arkiverar dem under Beställningar. Bara levererade, avbrutna och återbetalade går att arkivera."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
          {visible.map((order) => {
            const open = openId === order.id;
            const items = order.order_items || [];
            const trackingUrl = resolveTrackingUrl({
              carrier: order.shipping_carrier,
              trackingNumber: order.tracking_number,
              trackingUrl: order.tracking_url,
            });

            return (
              <div key={order.id} className="border-b border-slate-800/70 last:border-b-0">
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : order.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    aria-expanded={open}
                  >
                    {open ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-sm font-semibold text-slate-300">
                        {displayNumber(order)}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {order.customer_name || "Okänd kund"}
                        {order.customer_email ? ` · ${order.customer_email}` : ""}
                      </p>
                    </div>
                  </button>

                  <span
                    className={`hidden w-28 shrink-0 text-xs font-semibold uppercase tracking-wide sm:block ${
                      order.status === "cancelled" || order.status === "refunded"
                        ? "text-rose-300/70"
                        : "text-slate-500"
                    }`}
                  >
                    {statusLabel(order)}
                  </span>

                  <span className="w-28 shrink-0 text-right text-sm font-semibold tabular-nums text-slate-400">
                    {formatCurrency(order.total_cents)}
                  </span>

                  <span className="hidden w-36 shrink-0 text-right text-xs text-slate-500 lg:block">
                    Arkiverad {formatDate(order.archived_at)}
                  </span>

                  <div className="flex shrink-0 items-center gap-2">
                    {busyId === order.id && (
                      <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                    )}
                    {canWrite && (
                      <button
                        type="button"
                        onClick={() => void restore(order)}
                        disabled={busyId === order.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:border-cyan-400/60 hover:text-cyan-300 disabled:opacity-50"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Hämta tillbaka
                      </button>
                    )}
                  </div>
                </div>

                {open && (
                  <div className="grid gap-5 border-t border-slate-800/70 bg-slate-950/40 px-4 py-4 text-sm lg:grid-cols-[1.4fr_1fr]">
                    <div>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Innehåll
                      </p>
                      <div className="space-y-2">
                        {items.length === 0 && (
                          <p className="text-xs text-slate-500">Inga rader sparade på ordern.</p>
                        )}
                        {items.map((item) => (
                          <div key={item.id} className="rounded-lg border border-slate-800 px-3 py-2">
                            <div className="flex items-baseline justify-between gap-3">
                              <span className="text-slate-200">
                                {item.product?.name || "Produkt"}
                                {item.quantity > 1 ? ` × ${item.quantity}` : ""}
                              </span>
                              <span className="shrink-0 tabular-nums text-slate-400">
                                {formatCurrency((item.unit_price_cents || 0) * item.quantity)}
                              </span>
                            </div>
                            {item.serial_number && (
                              <p className="mt-1 font-mono text-xs text-slate-400">
                                Serienummer: {item.serial_number}
                              </p>
                            )}
                            {item.build_notes && (
                              <p className="mt-1 text-xs text-slate-500">{item.build_notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-slate-400">
                      <p>
                        <span className="text-slate-500">Beställd:</span>{" "}
                        {formatDate(order.created_at)}
                      </p>
                      {order.customer_phone && (
                        <p>
                          <span className="text-slate-500">Telefon:</span> {order.customer_phone}
                        </p>
                      )}
                      {order.cancelled_at && (
                        <p className="text-rose-300/80">
                          Avbruten {formatDate(order.cancelled_at)}
                          {order.cancel_reason ? ` · ${order.cancel_reason}` : ""}
                        </p>
                      )}
                      {order.tracking_number && (
                        <p className="flex items-center gap-1.5">
                          <Truck className="h-3.5 w-3.5 text-slate-500" />
                          {order.shipping_carrier
                            ? CARRIER_LABELS[order.shipping_carrier] || order.shipping_carrier
                            : "Frakt"}
                          {trackingUrl ? (
                            <a
                              href={trackingUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-[#9dd4e0] hover:text-white"
                            >
                              {order.tracking_number}
                            </a>
                          ) : (
                            <span className="font-mono">{order.tracking_number}</span>
                          )}
                        </p>
                      )}
                      {order.receipt_url && (
                        <a
                          href={order.receipt_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex font-semibold text-[#9dd4e0] hover:text-white"
                        >
                          Visa kvitto
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && orders.length >= 200 && (
        <p className="text-xs text-slate-500">
          Visar de 200 senast arkiverade. Äldre än så ligger kvar i databasen men syns
          inte här.
        </p>
      )}
    </div>
  );
}
