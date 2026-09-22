import { useState } from "react";
import { Loader2, Wrench } from "lucide-react";

import { readApiError } from "../../apiError";
import { errorMessage } from "@/lib/utils";

/**
 * Serienummer och byggnoteringar per maskin i en order.
 *
 * ERSÄTTER BYGGCHECKLISTAN
 *
 * Checklistan kryssade av sex steg som redan framgick av byggstatusen
 * ovanför - samma uppgift två gånger på två ställen, som kunde säga
 * emot varandra. En order kunde stå på "Skickad" med halva listan
 * okryssad, och då visste ingen vilken av dem som var sann.
 *
 * Det här säger i stället något som statusen inte kan: vilket exemplar
 * kunden fick. Kommer maskinen tillbaka med ett garantiärende om ett år
 * är serienumret det enda som avgör vilken av dem det gäller.
 *
 * Noteringen är skriven till nästa person hos er - vilka delar som
 * byttes, vad som avvek - och visas aldrig för kunden. Serienumret gör
 * det, på kundens egen ordersida.
 */

export type BuildItem = {
  id: string;
  serial_number?: string | null;
  build_notes?: string | null;
  product?: { name?: string | null } | null;
};

type Row = { id: string; name: string; serial: string; notes: string };

const toRows = (items: BuildItem[]): Row[] =>
  items.map((item) => ({
    id: item.id,
    name: item.product?.name || "",
    serial: item.serial_number || "",
    notes: item.build_notes || "",
  }));

export const BuildDetails = ({
  apiBase,
  token,
  orderId,
  items,
  canMutate,
  onSaved,
}: {
  apiBase: string;
  token: string;
  orderId: string;
  items: BuildItem[];
  canMutate: boolean;
  onSaved: (saved: { id: string; serial_number: string; build_notes: string }[]) => void;
}) => {
  const rows = toRows(items);
  const signature = JSON.stringify(rows);

  const [draft, setDraft] = useState<Row[]>(rows);
  const [syncedFrom, setSyncedFrom] = useState(signature);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  /* Listan kommer som en ny array vid varje omritning, så en useEffect
     på items hade nollat fältet mitt i att man skriver i det. Jämför
     innehållet i stället och ta om utkastet bara när det faktiskt
     ändrats i databasen. */
  if (syncedFrom !== signature) {
    setSyncedFrom(signature);
    setDraft(rows);
    setSaved(false);
  }

  const dirty = JSON.stringify(draft) !== signature;

  const update = (id: string, changes: Partial<Row>) =>
    setDraft((prev) => prev.map((row) => (row.id === id ? { ...row, ...changes } : row)));

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = draft.map((row) => ({
        id: row.id,
        serial_number: row.serial.trim(),
        build_notes: row.notes.trim(),
      }));
      const response = await fetch(`${apiBase}/api/admin/v2/orders/${orderId}/byggdetaljer`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload }),
      });
      if (!response.ok) {
        throw new Error(await readApiError(response, "Kunde inte spara byggdetaljerna."));
      }
      onSaved(payload);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (saveError) {
      setError(errorMessage(saveError, "Kunde inte spara byggdetaljerna."));
    } finally {
      setSaving(false);
    }
  };

  if (draft.length === 0) return null;

  return (
    <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
        <Wrench className="h-4 w-4 text-primary" />
        Byggdetaljer
      </div>

      <div className="space-y-3">
        {draft.map((row) => (
          <div key={row.id} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
            <label className="block">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Serienummer{draft.length > 1 && row.name ? ` · ${row.name}` : ""}
              </span>
              <input
                value={row.serial}
                disabled={!canMutate || saving}
                onChange={(event) => update(row.id, { serial: event.target.value })}
                placeholder="Numret på chassit"
                className="w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 font-mono text-sm text-slate-100 placeholder:text-slate-600 focus:border-primary/60 focus:outline-none disabled:opacity-50"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Notering · syns inte för kunden
              </span>
              <input
                value={row.notes}
                disabled={!canMutate || saving}
                onChange={(event) => update(row.id, { notes: event.target.value })}
                placeholder="Bytt nätaggregat, kunden ville ha tystare fläkt…"
                className="w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-primary/60 focus:outline-none disabled:opacity-50"
              />
            </label>
          </div>
        ))}
      </div>

      {error ? <p className="mt-3 text-xs text-rose-300">{error}</p> : null}

      {canMutate ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void save()}
            disabled={!dirty || saving}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-primary/60 hover:text-primary disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Spara byggdetaljer
          </button>
          {saved ? <span className="text-xs text-emerald-300">Sparat</span> : null}
          <span className="text-[11px] text-slate-500">
            Serienumret visas för kunden på ordersidan.
          </span>
        </div>
      ) : (
        <p className="mt-3 text-[11px] text-slate-500">
          Du har läsbehörighet och kan inte ändra byggdetaljerna.
        </p>
      )}
    </div>
  );
};

export default BuildDetails;
