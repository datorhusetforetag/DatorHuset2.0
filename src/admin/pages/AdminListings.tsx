import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  GripVertical,
  Loader2,
  Package,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";

import { AdminAccessContext } from "../useAdminAccess";
import { errorMessage } from "@/lib/utils";
import { ListingEditor } from "./listings/ListingEditor";
import {
  ARCHIVED,
  PREORDER,
  READY,
  type Listing,
  type ListingGroup,
  emptyDraft,
  formatPrice,
  groupOf,
  statusOf,
} from "./listings/listingModel";

/**
 * Listningar.
 *
 * ETT STÄLLE I STÄLLET FÖR TVÅ
 *
 * Produkter och Lager låg tidigare på var sin sida. Lagersaldot är en
 * egenskap hos en listning, inte ett eget ämne, och delningen betydde
 * att frågan "är den här slut?" krävde två sidor och ett id i huvudet.
 *
 * TVÅ GRUPPER, FÖR DE SKÖTS OLIKA
 *
 * Förbeställningar ändras sällan - pris och specifikation då och då -
 * och de är de flesta. Redo att skickas är få, men saldot rör sig varje
 * vecka. En enda lång lista hade behandlat dem lika. Här ligger Redo
 * att skickas överst med saldot direkt redigerbart i raden, och
 * förbeställningarna under i en lugnare form.
 *
 * ORDNINGEN ÄR DEN PÅ PRODUKTSIDAN
 *
 * Pilarna flyttar kortet i butiken, inte bara i den här tabellen.
 * Ordningen sparas för sig med PATCH .../listings/order, inte genom att
 * spara om hela listningen: en flytt ska inte kunna ta med sig ett
 * halvskrivet prisfält.
 *
 * Piltangenter och inte dra-och-släpp. Dragning kräver en mus, en stadig
 * hand och fungerar dåligt på pekskärm; två knappar gör samma sak, går
 * att nå med tangentbord och kan upprepas utan att sikta.
 */

const API_PAGE_SIZE = 250;

type ToastState = { kind: "ok" | "error"; text: string } | null;

export default function AdminListings() {
  const { token, apiBase, role } = useOutletContext<AdminAccessContext>();
  const canWrite = role === "admin" || role === "ops";

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  /* Beskedet försvinner av sig självt. Ett kvitto på att sparandet gick
     igenom behöver inte stå kvar och kräva ett klick för att gå bort. */
  const toastTimer = useRef<number | null>(null);
  const flash = useCallback((kind: "ok" | "error", text: string) => {
    setToast({ kind, text });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), kind === "ok" ? 2600 : 6000);
  }, []);
  useEffect(
    () => () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    },
    [],
  );

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" }),
    [token],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await fetch(
        `${apiBase}/api/admin/v2/listings?limit=${API_PAGE_SIZE}&sort=sort_order&order=asc`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error?.message || payload?.error || "Kunde inte hämta listningarna.");
      }
      setListings(Array.isArray(payload?.data) ? payload.data : []);
    } catch (error) {
      setLoadError(errorMessage(error, "Kunde inte hämta listningarna."));
    } finally {
      setLoading(false);
    }
  }, [apiBase, token]);

  useEffect(() => {
    if (token) void load();
  }, [token, load]);

  /* Sökningen sker här och inte på servern. Tjugo listningar får plats i
     minnet, och ett anrop per tangenttryck vore både långsammare och
     mer trafik för samma svar. */
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return listings.filter((listing) => {
      if (!showArchived && listing.archived_at) return false;
      if (!term) return true;
      return [listing.name, listing.cpu, listing.gpu, listing.slug]
        .some((field) => String(field || "").toLowerCase().includes(term));
    });
  }, [listings, query, showArchived]);

  const grouped = useMemo(() => {
    const buckets: Record<ListingGroup, Listing[]> = { ready: [], preorder: [], archived: [] };
    visible.forEach((listing) => buckets[groupOf(listing)].push(listing));
    /* Inom varje grupp gäller butikens ordning. Utan sort_order hamnar
       maskinen sist i stället för först, så en ny listning inte hoppar
       upp i toppen av butiken innan någon bestämt var den ska ligga. */
    const byOrder = (a: Listing, b: Listing) => {
      const left = a.sort_order ?? Number.MAX_SAFE_INTEGER;
      const right = b.sort_order ?? Number.MAX_SAFE_INTEGER;
      if (left !== right) return left - right;
      return String(a.name || "").localeCompare(String(b.name || ""), "sv");
    };
    buckets.ready.sort(byOrder);
    buckets.preorder.sort(byOrder);
    buckets.archived.sort(byOrder);
    return buckets;
  }, [visible]);

  const patchLocal = useCallback((id: string, changes: Partial<Listing>) => {
    setListings((prev) => prev.map((listing) => (listing.id === id ? { ...listing, ...changes } : listing)));
  }, []);

  /* Flytt i butiken.
     Hela den synliga ordningen skickas, inte bara de två som bytt plats.
     Servern skriver sort_order rakt av, och skickar man bara paret kan
     talen krocka med rader som filtrerats bort ur vyn. */
  const move = useCallback(
    async (listing: Listing, direction: -1 | 1) => {
      const siblings = grouped[groupOf(listing)];
      const index = siblings.findIndex((row) => row.id === listing.id);
      const target = index + direction;
      if (index === -1 || target < 0 || target >= siblings.length) return;

      const next = [...siblings];
      [next[index], next[target]] = [next[target], next[index]];

      const order = next.map((row, position) => ({ id: row.id, sort_order: (position + 1) * 10 }));
      order.forEach((row) => patchLocal(row.id, { sort_order: row.sort_order }));

      setBusyId(listing.id);
      try {
        const response = await fetch(`${apiBase}/api/admin/v2/listings/order`, {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({ order }),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.error?.message || payload?.error || "Kunde inte spara ordningen.");
        }
      } catch (error) {
        flash("error", errorMessage(error, "Kunde inte spara ordningen."));
        void load();
      } finally {
        setBusyId(null);
      }
    },
    [apiBase, authHeaders, flash, grouped, load, patchLocal],
  );

  const setArchived = useCallback(
    async (listing: Listing, archived: boolean) => {
      if (archived) {
        const confirmed = window.confirm(
          `Ta bort "${listing.name}" från butiken?\n\n` +
            "Listningen döljs på sajten men raderas inte, så tidigare ordrar " +
            "behåller sitt innehåll. Du kan hämta tillbaka den när som helst " +
            'under "Borttagna".',
        );
        if (!confirmed) return;
      }
      setBusyId(listing.id);
      try {
        const response = await fetch(`${apiBase}/api/admin/v2/listings/${listing.id}/archive`, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ archived }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload?.error?.message || payload?.error || "Gick inte att ändra.");
        }
        patchLocal(listing.id, {
          archived_at: archived ? new Date().toISOString() : null,
          ...(archived ? { quantity_in_stock: 0, is_preorder: false } : {}),
        });
        flash("ok", archived ? `${listing.name} är borttagen från butiken.` : `${listing.name} är tillbaka.`);
      } catch (error) {
        flash("error", errorMessage(error, "Gick inte att ändra."));
      } finally {
        setBusyId(null);
      }
    },
    [apiBase, authHeaders, flash, patchLocal],
  );

  const editing = useMemo(
    () => (editingId ? listings.find((listing) => listing.id === editingId) || null : null),
    [editingId, listings],
  );

  const counts = useMemo(
    () => ({
      ready: listings.filter((l) => !l.archived_at && groupOf(l) === "ready").length,
      preorder: listings.filter((l) => !l.archived_at && groupOf(l) === "preorder").length,
      archived: listings.filter((l) => Boolean(l.archived_at)).length,
    }),
    [listings],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Listningar</h2>
          <p className="mt-1 text-sm text-slate-400">
            {counts.ready} redo att skickas · {counts.preorder} förbeställningar
            {counts.archived > 0 && ` · ${counts.archived} borttagna`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
          {canWrite && (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
            >
              <Plus className="h-4 w-4" />
              Ny listning
            </button>
          )}
        </div>
      </header>

      {toast && (
        <div
          role="status"
          className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
            toast.kind === "ok"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
              : "border-rose-500/40 bg-rose-500/10 text-rose-200"
          }`}
        >
          {toast.kind === "ok" ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {toast.text}
        </div>
      )}

      {loadError && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          <span>{loadError}</span>
          <button type="button" onClick={() => void load()} className="font-semibold underline">
            Försök igen
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 px-6 py-12 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Hämtar listningar...
        </div>
      ) : (
        <>
          <Section
            title="Redo att skickas"
            hint="Ligger i lager. Saldot ändras direkt i raden."
            rows={grouped.ready}
            group={READY}
          />
          <Section
            title="Förbeställningar"
            hint="Byggs på beställning. Leveranstiden syns för kunden."
            rows={grouped.preorder}
            group={PREORDER}
          />

          {counts.archived > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowArchived((prev) => !prev)}
                className="text-sm font-semibold text-slate-400 hover:text-slate-200"
              >
                {showArchived ? "Dölj" : "Visa"} borttagna ({counts.archived})
              </button>
              {showArchived && (
                <div className="mt-4">
                  <Section
                    title="Borttagna"
                    hint="Dolda på sajten. Ordrar som innehåller dem är orörda."
                    rows={grouped.archived}
                    group={ARCHIVED}
                  />
                </div>
              )}
            </div>
          )}

          {visible.length === 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 px-6 py-16 text-center">
              <Package className="mx-auto h-8 w-8 text-slate-600" />
              <p className="mt-4 font-semibold text-slate-200">
                {query ? "Ingen listning matchar sökningen" : "Inga listningar än"}
              </p>
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="mt-3 text-sm font-semibold text-cyan-300 hover:underline"
                >
                  Rensa sökningen
                </button>
              )}
            </div>
          )}
        </>
      )}

      {(editing || creating) && (
        <ListingEditor
          apiBase={apiBase}
          token={token}
          canWrite={canWrite}
          listing={editing}
          draft={creating ? emptyDraft() : null}
          onClose={() => {
            setEditingId(null);
            setCreating(false);
          }}
          onSaved={(message) => {
            setEditingId(null);
            setCreating(false);
            flash("ok", message);
            void load();
          }}
        />
      )}
    </div>
  );

  function Section({
    title,
    hint,
    rows,
    group,
  }: {
    title: string;
    hint: string;
    rows: Listing[];
    group: ListingGroup;
  }) {
    if (rows.length === 0) return null;
    return (
      <section>
        <div className="mb-3 flex items-baseline gap-3">
          <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-300">{title}</h3>
          <p className="text-xs text-slate-500">{hint}</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
          {rows.map((listing, index) => (
            <Row
              key={listing.id}
              listing={listing}
              group={group}
              isFirst={index === 0}
              isLast={index === rows.length - 1}
            />
          ))}
        </div>
      </section>
    );
  }

  function Row({
    listing,
    group,
    isFirst,
    isLast,
  }: {
    listing: Listing;
    group: ListingGroup;
    isFirst: boolean;
    isLast: boolean;
  }) {
    const status = statusOf(listing);
    const busy = busyId === listing.id;

    return (
      <div className="flex items-center gap-3 border-b border-slate-800/70 px-3 py-3 last:border-b-0 hover:bg-slate-800/30">
        {/* Ordningen. Dolda i arkivet - en borttagen listning har ingen
            plats i butiken att flytta. */}
        {group !== ARCHIVED && canWrite ? (
          <div className="flex flex-col">
            <button
              type="button"
              disabled={isFirst || busy}
              onClick={() => void move(listing, -1)}
              aria-label={`Flytta ${listing.name} uppåt`}
              className="rounded p-0.5 text-slate-500 hover:text-cyan-300 disabled:opacity-25 disabled:hover:text-slate-500"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={isLast || busy}
              onClick={() => void move(listing, 1)}
              aria-label={`Flytta ${listing.name} nedåt`}
              className="rounded p-0.5 text-slate-500 hover:text-cyan-300 disabled:opacity-25 disabled:hover:text-slate-500"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <GripVertical className="h-4 w-4 text-slate-800" aria-hidden />
        )}

        <div className="h-11 w-14 shrink-0 overflow-hidden rounded-md border border-slate-800 bg-slate-950">
          {listing.image_url ? (
            <img src={listing.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-4 w-4 text-slate-700" />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setEditingId(listing.id)}
          className="min-w-0 flex-1 text-left"
        >
          <span className="block truncate text-sm font-semibold text-slate-100">{listing.name}</span>
          <span className="block truncate text-xs text-slate-500">
            {[listing.cpu, listing.gpu].filter(Boolean).join(" · ") || "Ingen specifikation"}
          </span>
        </button>

        <span className="hidden w-20 shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-400 sm:block">
          {listing.tier || "-"}
        </span>

        <span className="w-24 shrink-0 text-right text-sm font-semibold tabular-nums text-slate-100">
          {formatPrice(listing.price_cents)}
        </span>

        <span
          className={`hidden w-28 shrink-0 rounded-full px-2 py-1 text-center text-[11px] font-bold sm:block ${status.className}`}
        >
          {status.label}
        </span>

        <div className="flex shrink-0 items-center gap-1">
          {busy && <Loader2 className="h-4 w-4 animate-spin text-slate-500" />}
          {canWrite &&
            (group === ARCHIVED ? (
              <button
                type="button"
                onClick={() => void setArchived(listing, false)}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:border-cyan-400/60 hover:text-cyan-300 disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Återställ
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void setArchived(listing, true)}
                disabled={busy}
                aria-label={`Ta bort ${listing.name} från butiken`}
                className="rounded-lg p-2 text-slate-500 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ))}
        </div>
      </div>
    );
  }
}
