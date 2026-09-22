import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Archive, Loader2, Package, RotateCcw, Search } from "lucide-react";

import { AdminAccessContext } from "../useAdminAccess";
import { errorMessage } from "@/lib/utils";
import { readApiError } from "../apiError";
import { type Listing, formatPrice } from "./listings/listingModel";

/**
 * Arkiv slutsålda.
 *
 * Slutet på flödet: en maskin säljer slut, någon tar bort den från
 * sajten, och då hamnar den här. Ingenting raderas - raden finns kvar i
 * databasen, och en order som innehåller maskinen visar fortfarande
 * rätt namn och pris på sitt kvitto.
 *
 * Sidan ligger under Loggar och inte bland listningarna, för den är av
 * samma sort: något man går till för att slå upp eller ångra, inte
 * något man arbetar i.
 *
 * Att hämta tillbaka en listning ställer den inte automatiskt i
 * butiken igen. Den kommer tillbaka som slutsåld - med noll i lager -
 * och först när någon fyller på saldot går den att köpa. Annars hade
 * "Återställ" tyst kunnat släppa ut en maskin till försäljning som
 * ingen har på hyllan.
 */

export default function AdminArchive() {
  const { token, apiBase, role } = useOutletContext<AdminAccessContext>();
  const canWrite = role === "admin" || role === "ops";

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiBase}/api/admin/v2/listings?limit=250&sort=name&order=asc`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(await readApiError(response, "Kunde inte hämta arkivet."));
      }
      const payload = await response.json().catch(() => ({}));
      const rows: Listing[] = Array.isArray(payload?.data) ? payload.data : [];
      setListings(rows.filter((row) => Boolean(row.archived_at)));
    } catch (loadError) {
      setError(errorMessage(loadError, "Kunde inte hämta arkivet."));
    } finally {
      setLoading(false);
    }
  }, [apiBase, token]);

  useEffect(() => {
    if (token) void load();
  }, [token, load]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return listings;
    return listings.filter((listing) =>
      [listing.name, listing.cpu, listing.gpu].some((field) =>
        String(field || "").toLowerCase().includes(term),
      ),
    );
  }, [listings, query]);

  const restore = useCallback(
    async (listing: Listing) => {
      const confirmed = window.confirm(
        `Hämta tillbaka "${listing.name}"?\n\n` +
          "Den läggs tillbaka bland listningarna som slutsåld, med noll i " +
          "lager. Först när du fyller på saldot går den att köpa igen.",
      );
      if (!confirmed) return;

      setBusyId(listing.id);
      try {
        const response = await fetch(`${apiBase}/api/admin/v2/listings/${listing.id}/archive`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ archived: false }),
        });
        if (!response.ok) {
          throw new Error(await readApiError(response, "Kunde inte hämta tillbaka listningen."));
        }
        const payload = await response.json().catch(() => ({}));
        setListings((prev) => prev.filter((row) => row.id !== listing.id));
      } catch (restoreError) {
        setError(errorMessage(restoreError, "Kunde inte hämta tillbaka listningen."));
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
          <h2 className="text-2xl font-semibold text-white">Arkiv slutsålda</h2>
          <p className="mt-1 max-w-xl text-sm text-slate-400">
            Borttagna från butiken men inte raderade. Gamla ordrar visar fortfarande
            rätt namn och pris.
          </p>
        </div>

        {listings.length > 0 && (
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Sök namn, CPU, GPU"
              className="w-56 rounded-lg border border-slate-700/60 bg-slate-950/60 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none"
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
              ? "Prova ett annat ord."
              : "Listningar hamnar här när du tar bort dem från sajten under Slutsålda."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
          {visible.map((listing) => (
            <div
              key={listing.id}
              className="flex items-center gap-3 border-b border-slate-800/70 px-4 py-3 last:border-b-0"
            >
              <div className="h-11 w-14 shrink-0 overflow-hidden rounded-md border border-slate-800 bg-slate-950 opacity-60">
                {listing.image_url ? (
                  <img src={listing.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package className="h-4 w-4 text-slate-700" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-300">{listing.name}</p>
                <p className="truncate text-xs text-slate-500">
                  {[listing.cpu, listing.gpu].filter(Boolean).join(" · ") || "Ingen specifikation"}
                </p>
              </div>

              <span className="hidden w-20 shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:block">
                {listing.tier || "-"}
              </span>

              <span className="w-24 shrink-0 text-right text-sm font-semibold tabular-nums text-slate-400">
                {formatPrice(listing.price_cents)}
              </span>

              <span className="hidden w-32 shrink-0 text-right text-xs text-slate-500 lg:block">
                {listing.archived_at
                  ? `Borttagen ${new Date(listing.archived_at).toLocaleDateString("sv-SE")}`
                  : ""}
              </span>

              <div className="flex shrink-0 items-center gap-2">
                {busyId === listing.id && <Loader2 className="h-4 w-4 animate-spin text-slate-500" />}
                {canWrite && (
                  <button
                    type="button"
                    onClick={() => void restore(listing)}
                    disabled={busyId === listing.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:border-cyan-400/60 hover:text-cyan-300 disabled:opacity-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Hämta tillbaka
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
