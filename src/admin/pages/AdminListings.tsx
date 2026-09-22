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
  ExternalLink,
  Lock,
  Search,
  Trash2,
} from "lucide-react";

import { AdminAccessContext } from "../useAdminAccess";
import { errorMessage } from "@/lib/utils";
import { readApiError } from "../apiError";
import { ListingEditor } from "./listings/ListingEditor";
import {
  PREORDER,
  READY,
  SOLD_OUT,
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
  const {
    token,
    apiBase,
    role,
    user,
    error: accessError,
    refresh: refreshAccess,
  } = useOutletContext<AdminAccessContext>();
  const canWrite = role === "admin" || role === "ops";

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  /* Platserna kvar i verkstaden. Hämtas från samma öppna endpoint som
     butiken använder, så admin och kund ser samma siffra. */
  const [capacity, setCapacity] = useState<{ used: number; new: number; isFull: boolean } | null>(
    null,
  );

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
      if (!response.ok) {
        throw new Error(await readApiError(response, "Kunde inte hämta listningarna."));
      }
      const payload = await response.json().catch(() => ({}));
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

  useEffect(() => {
    let active = true;
    fetch(`${apiBase}/api/preorder-capacity`)
      .then((response) => response.json())
      .then((payload) => {
        if (active && payload?.data) setCapacity(payload.data);
      })
      .catch(() => {
        /* Siffran är upplysning, inte funktion. Går den inte att hämta
           visas den inte, och resten av sidan fungerar som vanligt. */
      });
    return () => {
      active = false;
    };
  }, [apiBase]);

  /* Sökningen sker här och inte på servern. Tjugo listningar får plats i
     minnet, och ett anrop per tangenttryck vore både långsammare och
     mer trafik för samma svar. */
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return listings.filter((listing) => {
      /* Arkiverade hör hemma under Arkiv slutsålda och ska inte synas
         bland det som säljs. */
      if (listing.archived_at) return false;
      if (!term) return true;
      return [listing.name, listing.cpu, listing.gpu, listing.slug]
        .some((field) => String(field || "").toLowerCase().includes(term));
    });
  }, [listings, query]);

  /*
   * Begagnatvarianter hör ihop med sin bas.
   *
   * En maskin som säljs både nybyggd och begagnad ligger som två
   * rader med samma namn. I listan såg det ut som en dubblett - "varför
   * står Platina Historia två gånger?" - fast det är ett val kunden
   * gör på produktsidan, inte ett fel.
   *
   * Varianten plockas därför ur huvudlistan och hängs under sin bas.
   * Saknas basen, till exempel för att den är arkiverad, får varianten
   * stå kvar på egen hand hellre än att försvinna helt.
   */
  const usedByBaseId = useMemo(() => {
    const map = new Map<string, Listing>();
    listings.forEach((listing) => {
      if (listing.variant_role === "used" && listing.linked_product_id) {
        map.set(listing.linked_product_id, listing);
      }
    });
    return map;
  }, [listings]);

  const hasVisibleBase = useCallback(
    (listing: Listing) =>
      listing.variant_role === "used" &&
      Boolean(listing.linked_product_id) &&
      listings.some(
        (row) => row.id === listing.linked_product_id && !row.archived_at,
      ),
    [listings],
  );

  const grouped = useMemo(() => {
    const buckets: Record<ListingGroup, Listing[]> = {
      ready: [],
      sold_out: [],
      preorder: [],
      archived: [],
    };
    visible
      .filter((listing) => !hasVisibleBase(listing))
      .forEach((listing) => buckets[groupOf(listing)].push(listing));
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
    buckets.sold_out.sort(byOrder);
    buckets.preorder.sort(byOrder);
    return buckets;
  }, [visible, hasVisibleBase]);

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

  /*
   * Flytta till en bestämd plats.
   *
   * Pilarna räcker för att putta ett kort ett steg, men inte för att
   * säga "den här ska ligga först". Med tjugo listningar blir det
   * nitton klick, och man tappar räkningen på vägen.
   *
   * Platsen räknas från ett, som den står i rutan bredvid, inte från
   * noll. Rutnätet i butiken är tre kort brett, så plats 4 är första
   * kortet på rad två - det står utskrivet i raden så man slipper
   * räkna själv.
   */
  const moveTo = useCallback(
    async (listing: Listing, position: number) => {
      const siblings = grouped[groupOf(listing)];
      const from = siblings.findIndex((row) => row.id === listing.id);
      const to = Math.min(Math.max(1, Math.round(position)), siblings.length) - 1;
      if (from === -1 || from === to) return;

      const next = [...siblings];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);

      const order = next.map((row, index) => ({ id: row.id, sort_order: (index + 1) * 10 }));
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
        const isUsed = listing.variant_role === "used";
        const confirmed = window.confirm(
          isUsed
            ? `Ta bort det begagnade skicket av "${listing.name}"?\n\n` +
              "Den nybyggda versionen står kvar i butiken. Bara valet " +
              "Begagnad försvinner från produktsidan."
            : `Ta bort "${listing.name}" från butiken?\n\n` +
              "Listningen döljs på sajten men raderas inte, så tidigare ordrar " +
                "behåller sitt innehåll. Den hamnar under Arkiv slutsålda, där " +
                "du kan hämta tillbaka den när som helst.",
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
        if (!response.ok) {
          throw new Error(await readApiError(response, "Gick inte att ändra."));
        }
        const payload = await response.json().catch(() => ({}));
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
      ready: listings.filter((l) => groupOf(l) === READY).length,
      soldOut: listings.filter((l) => groupOf(l) === SOLD_OUT).length,
      preorder: listings.filter((l) => groupOf(l) === PREORDER).length,
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
            {counts.soldOut > 0 && ` · ${counts.soldOut} slutsålda`}
          </p>
          {capacity && (
            <p className={`mt-1.5 text-xs ${capacity.isFull ? "text-rose-300" : "text-slate-500"}`}>
              {capacity.isFull
                ? "Verkstaden är full - inga fler förbeställningar tas emot"
                : `Plats kvar: ${capacity.new} nybyggda, ${capacity.used} begagnade`}
            </p>
          )}
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

      {!canWrite && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            {/* Ingen roll alls och läsbehörighet är två olika saker, och
                de åtgärdas på olika sätt. Att kalla båda för
                "läsbehörighet" skickar folk till Supabase för att ändra
                något som redan står rätt. */}
            <p className="font-semibold">
              {role
                ? "Du har läsbehörighet"
                : "Din behörighet har inte lästs in"}
            </p>
            <p className="mt-1 text-amber-200/80">
              Därför syns varken knappen för ny listning, pilarna för ordning,
              platsrutan eller borttagning.
            </p>
            <p className="mt-2 font-mono text-xs text-amber-200/70">
              konto: {user?.email || "okänt"} · roll: {role || "ingen"}
              {accessError ? ` · fel: ${accessError}` : ""}
            </p>
            {role ? (
              <p className="mt-2 text-amber-200/80">
                Rollen sätts på kontot i Supabase, under app_metadata. Sätt role
                till admin eller ops, logga sedan ut och in igen - rollen läses
                ur inloggningen och följer med först vid nästa.
              </p>
            ) : (
              <>
                <p className="mt-2 text-amber-200/80">
                  Servern har inte hunnit svara på vilken roll du har, eller så
                  avvisades frågan. Står rätt roll i Supabase räcker det oftast
                  att hämta behörigheten igen.
                </p>
                <button
                  type="button"
                  onClick={() => void refreshAccess()}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-amber-400/50 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-400/10"
                >
                  Hämta behörigheten igen
                </button>
              </>
            )}
          </div>
        </div>
      )}

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
            hint="Ligger i lager och går att köpa nu."
            rows={grouped.ready}
            group={READY}
          />
          {/* Slutsålda står för sig. De syns fortfarande i butiken,
              märkta "Slutsåld", tills någon bestämmer sig - antingen
              fylla på lagret eller ta bort dem från sajten. Som en
              del av Redo att skickas hade de sett ut som säljbara. */}
          <Section
            title="Slutsålda"
            hint={'Syns i butiken som "Slutsåld". Ta bort dem från sajten eller fyll på lagret.'}
            rows={grouped.sold_out}
            group={SOLD_OUT}
          />
          <Section
            title="Förbeställningar"
            hint="Byggs på beställning. Leveranstiden syns för kunden."
            rows={grouped.preorder}
            group={PREORDER}
          />

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
          {rows.map((listing, index) => {
            const used = usedByBaseId.get(listing.id);
            return (
              <div key={listing.id}>
                <Row
                  listing={listing}
                  group={group}
                  isFirst={index === 0}
                  isLast={index === rows.length - 1 && !used}
                  position={index + 1}
                  total={rows.length}
                />
                {used && <UsedRow listing={used} />}
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  /*
   * Begagnatvarianten, indragen under sin bas.
   *
   * Medvetet mindre än en vanlig rad: den är ett andra skick av samma
   * maskin, inte en egen produkt. Ingen ordning att flytta - varianten
   * följer basen på produktsidan.
   *
   * Borttagning finns däremot, och gäller bara varianten. Det andra
   * begagnade exemplaret kan ta slut medan maskinen fortfarande byggs
   * ny, och då ska skicket kunna försvinna utan att maskinen gör det.
   */
  function UsedRow({ listing }: { listing: Listing }) {
    const busy = busyId === listing.id;
    return (
      <div className="flex items-center gap-3 border-b border-slate-800/70 bg-slate-950/30 py-2 pl-12 pr-3 last:border-b-0">
        <span className="text-xs text-slate-600">└</span>
        <button
          type="button"
          onClick={() => setEditingId(listing.id)}
          className="min-w-0 flex-1 text-left"
        >
          <span className="text-xs font-semibold text-slate-300">Begagnad</span>
          <span className="ml-2 text-xs text-slate-500">{listing.name}</span>
        </button>
        <span className="w-24 shrink-0 text-right text-xs font-semibold tabular-nums text-slate-300">
          {formatPrice(listing.price_cents)}
        </span>
        <span className="hidden w-28 shrink-0 text-center text-[11px] text-slate-500 sm:block">
          {listing.quantity_in_stock > 0 ? `${listing.quantity_in_stock} i lager` : "Slut"}
        </span>
        <div className="flex w-9 shrink-0 items-center justify-end">
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />}
          {canWrite && !busy && (
            <button
              type="button"
              onClick={() => void setArchived(listing, true)}
              aria-label={`Ta bort den begagnade varianten av ${listing.name}`}
              title="Ta bort bara det begagnade skicket"
              className="rounded p-1.5 text-slate-600 hover:bg-rose-500/10 hover:text-rose-300"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  function Row({
    listing,
    group,
    isFirst,
    isLast,
    position,
    total,
  }: {
    listing: Listing;
    group: ListingGroup;
    isFirst: boolean;
    isLast: boolean;
    position: number;
    total: number;
  }) {
    const status = statusOf(listing);
    const busy = busyId === listing.id;
    /* Butiken lägger tre kort per rad på bred skärm. Se grid-cols-3
       i Products.tsx. */
    const row = Math.floor((position - 1) / 3) + 1;
    const slot = ((position - 1) % 3) + 1;

    return (
      <div className="flex items-center gap-3 border-b border-slate-800/70 px-3 py-3 last:border-b-0 hover:bg-slate-800/30">
        {/* Ordningen i butiken. Alla rader här ligger på sajten, så
            alla går att flytta. */}
        {canWrite ? (
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

        {/* Platsen i butiken. Rutan tar ett tal; texten under säger
            vilken rad och plats det blir, så man slipper räkna. */}
        {canWrite && (
          <div className="hidden w-20 shrink-0 text-center lg:block">
            <input
              type="number"
              min={1}
              max={total}
              defaultValue={position}
              key={`${listing.id}-${position}`}
              disabled={busy}
              aria-label={`Plats för ${listing.name}`}
              onBlur={(event) => {
                const next = Number(event.target.value);
                if (next && next !== position) void moveTo(listing, next);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
              className="w-12 rounded border border-slate-700/60 bg-slate-950/60 px-1 py-1 text-center text-xs tabular-nums text-slate-100 focus:border-cyan-400/60 focus:outline-none"
            />
            <span className="mt-0.5 block text-[10px] text-slate-600">
              rad {row}, plats {slot}
            </span>
          </div>
        )}

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
          {/* Rakt till den sida kunden ser. Snabbaste sättet att
              upptäcka ett fel pris eller en bild som saknas är att
              titta på den riktiga sidan, och utan den här länken
              betyder det att kopiera namnet och leta i butiken. */}
          <a
            href={`/computer/${listing.slug || listing.id}`}
            target="_blank"
            rel="noreferrer"
            aria-label={`Visa ${listing.name} på sajten`}
            title="Visa på sajten"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-cyan-300"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          {/* På en slutsåld rad är det här huvudhandlingen, och då ska
              den vara läsbar i klartext. På övriga är det en åtgärd man
              sällan tar, och där räcker ikonen. */}
          {canWrite &&
            (group === SOLD_OUT ? (
              <button
                type="button"
                onClick={() => void setArchived(listing, true)}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:border-rose-400/60 hover:text-rose-300 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Ta bort från sajten
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
