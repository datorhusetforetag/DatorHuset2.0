import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { readApiError } from "../../apiError";
import { errorMessage } from "@/lib/utils";

/**
 * Uppgraderingarna för en listning.
 *
 * VARJE UPPGRADERING ÄR EN RIKTIG PRODUKT
 *
 * Man väljer den ur en lista över befintliga listningar, inte genom att
 * skriva ett namn och ett pris. Varukorgen tar ett produkt-id och ett
 * antal, så ett pristillägg som bara fanns i produktsidans vy hade
 * visats för kunden men aldrig följt med till kassan. Att kunna skriva
 * ett fritt pris här hade alltså byggt in exakt det felet.
 *
 * Priset står som upplysning och sparas inte. Det hämtas ur produkten
 * varje gång sidan ritas, så en prisändring slår igenom på båda
 * ställena samtidigt.
 *
 * GRUPPEN
 *
 * Bestämmer vilken rubrik kortet hamnar under på produktsidan.
 * Processor och grafikkort är en grupp och inte två: de byts i
 * praktiken ihop, och var för sig bjuder de in till obalanserade
 * byggen.
 */

export type Upgrade = {
  product_id: string;
  group: "storage" | "performance" | "ram" | "other";
  label: string;
  summary?: string | null;
};

type ProductOption = { id: string; name: string; price_cents: number };

const GROUPS: { value: Upgrade["group"]; label: string }[] = [
  { value: "performance", label: "Processor och grafikkort" },
  { value: "storage", label: "Lagring" },
  { value: "ram", label: "Minne" },
  { value: "other", label: "Övrigt" },
];

const kr = (cents: number) => `${Math.round((cents || 0) / 100).toLocaleString("sv-SE")} kr`;

export const UpgradeEditor = ({
  apiBase,
  token,
  currentListingId,
  value,
  onChange,
}: {
  apiBase: string;
  token: string;
  /** Den listning som redigeras. Den ska inte kunna välja sig själv. */
  currentListingId: string;
  value: Upgrade[];
  onChange: (next: Upgrade[]) => void;
}) => {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`${apiBase}/api/admin/v2/listings?limit=250&sort=name&order=asc`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(await readApiError(response, "Kunde inte hämta produkterna."));
        }
        const payload = await response.json().catch(() => ({}));
        const rows = Array.isArray(payload?.data) ? payload.data : [];
        if (!active) return;
        setProducts(
          rows
            .filter((row: { archived_at?: string | null }) => !row.archived_at)
            .map((row: { id: string; name: string; price_cents: number }) => ({
              id: row.id,
              name: row.name,
              price_cents: row.price_cents,
            })),
        );
      })
      .catch((loadError) => {
        if (active) setError(errorMessage(loadError, "Kunde inte hämta produkterna."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [apiBase, token]);

  const byId = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  /* Den listning man står i, och de som redan används, faller bort. En
     produkt kan inte vara en uppgradering av sig själv, och samma
     uppgradering två gånger är en dubblett i kundens val. */
  const available = useMemo(
    () =>
      products.filter(
        (product) =>
          product.id !== currentListingId &&
          !value.some((upgrade) => upgrade.product_id === product.id),
      ),
    [products, currentListingId, value],
  );

  const add = () => {
    const first = available[0];
    if (!first) return;
    onChange([
      ...value,
      { product_id: first.id, group: "performance", label: first.name, summary: null },
    ]);
  };

  const update = (index: number, changes: Partial<Upgrade>) =>
    onChange(value.map((row, i) => (i === index ? { ...row, ...changes } : row)));

  const remove = (index: number) => onChange(value.filter((_, i) => i !== index));

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-xs text-slate-500">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Hämtar produkter...
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-xs text-rose-300">{error}</p>}

      {/* Varför listan saknar en post är inte självklart, och en
          rullgardin med ett saknat namn läses som ett fel. */}
      <p className="text-xs leading-relaxed text-slate-500">
        En uppgradering är en <em>annan</em> produkt som kunden köper i
        stället för den här. Därför står inte listningen du redigerar med i
        listan, och inte heller de du redan valt.
      </p>

      {value.length === 0 && (
        <p className="text-xs leading-relaxed text-slate-500">
          Inga uppgraderingar satta. Lägg till en så får kunden välja mellan
          grundmaskinen och en dyrare variant på produktsidan.
        </p>
      )}

      {value.map((upgrade, index) => {
        const product = byId.get(upgrade.product_id);
        return (
          <div
            key={`${upgrade.product_id}-${index}`}
            className="rounded-lg border border-slate-800 bg-slate-950/40 p-3"
          >
            <div className="flex items-start gap-2">
              <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Kunden köper i stället
                  </span>
                  <select
                    value={upgrade.product_id}
                    onChange={(event) => {
                      const next = byId.get(event.target.value);
                      update(index, {
                        product_id: event.target.value,
                        /* Etiketten följer med bara när den inte rörts,
                           så ett eget namn inte skrivs över. */
                        label:
                          upgrade.label === product?.name ? next?.name || upgrade.label : upgrade.label,
                      });
                    }}
                    className="w-full rounded border border-slate-700/60 bg-slate-950/60 px-2 py-1.5 text-xs text-slate-100 focus:border-cyan-400/60 focus:outline-none"
                  >
                    {/* Den valda står alltid med, även om den hunnit bli
                        arkiverad - annars byts den tyst mot en annan. */}
                    {product && !available.some((row) => row.id === product.id) && (
                      <option value={product.id}>{product.name}</option>
                    )}
                    {!product && <option value={upgrade.product_id}>Produkten finns inte kvar</option>}
                    {available.map((row) => (
                      <option key={row.id} value={row.id}>
                        {row.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Rubrik på produktsidan
                  </span>
                  <select
                    value={upgrade.group}
                    onChange={(event) =>
                      update(index, { group: event.target.value as Upgrade["group"] })
                    }
                    className="w-full rounded border border-slate-700/60 bg-slate-950/60 px-2 py-1.5 text-xs text-slate-100 focus:border-cyan-400/60 focus:outline-none"
                  >
                    {GROUPS.map((group) => (
                      <option key={group.value} value={group.value}>
                        {group.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Text på kortet
                  </span>
                  <input
                    value={upgrade.label}
                    onChange={(event) => update(index, { label: event.target.value })}
                    placeholder="64GB DDR5"
                    className="w-full rounded border border-slate-700/60 bg-slate-950/60 px-2 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:border-cyan-400/60 focus:outline-none"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Underrubrik
                  </span>
                  <input
                    value={upgrade.summary || ""}
                    onChange={(event) => update(index, { summary: event.target.value })}
                    placeholder="Dubbelt så mycket minne"
                    className="w-full rounded border border-slate-700/60 bg-slate-950/60 px-2 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:border-cyan-400/60 focus:outline-none"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={() => remove(index)}
                aria-label="Ta bort uppgraderingen"
                className="shrink-0 rounded p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-300"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* Priset är upplysning och sparas inte - det hämtas ur
                produkten när produktsidan ritas. */}
            <p className="mt-2 text-[11px] text-slate-500">
              {product
                ? `Kunden betalar ${kr(product.price_cents)} när den här väljs.`
                : "Produkten hittades inte. Uppgraderingen visas inte på sajten förrän den pekar på något som finns."}
            </p>
          </div>
        );
      })}

      <button
        type="button"
        onClick={add}
        disabled={available.length === 0}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-cyan-400/60 hover:text-cyan-300 disabled:opacity-40"
      >
        <Plus className="h-3.5 w-3.5" />
        Lägg till uppgradering
      </button>

      {available.length === 0 && value.length > 0 && (
        <p className="text-[11px] text-slate-500">
          Alla andra listningar är redan valda. Skapa en ny listning för den
          uppgraderade maskinen om du vill ha fler.
        </p>
      )}

      <p className="text-[11px] leading-relaxed text-slate-500">
        Priset kommer från produkten, inte härifrån. Ändrar du priset på den
        uppgraderade maskinen syns det direkt på produktsidan.
      </p>
    </div>
  );
};

export default UpgradeEditor;
