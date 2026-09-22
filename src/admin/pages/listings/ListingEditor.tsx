import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ExternalLink, Eye, Loader2, Trash2, Upload, X } from "lucide-react";

import { errorMessage } from "@/lib/utils";
import { readApiError } from "../../apiError";
import { type Listing, formatPrice } from "./listingModel";
import { FpsEditor, type FpsSettings } from "./FpsEditor";

/**
 * Redigera en listning.
 *
 * ETT LÅNGT FORMULÄR, INTE FLIKAR
 *
 * Fälten hör ihop: priset ska kunna ses samtidigt som grafikkortet,
 * eftersom det ena motiverar det andra. Flikar hade gömt hälften av
 * underlaget bakom ett klick varje gång man vill jämföra.
 *
 * Panelen ligger över sidan i stället för att ersätta den, så listan
 * finns kvar bakom och man vet var man är på väg tillbaka till.
 *
 * VAD SOM SPARAS
 *
 * Hela listningen skickas, som API:t vill ha den. expected_updated_at
 * följer med: har någon annan sparat under tiden svarar servern 409 i
 * stället för att låta den sista tysta över den första.
 */

const TIERS = ["Brons", "Silver", "Guld", "Platina", "Diamant"];
const TAGS = ["Budgetvänliga", "Price-Performance", "Bästa prestanda"];
const STORAGE_TYPES = ["SSD", "NVMe", "HDD"];

/* Rubrikerna produktsidan sätter på avsnitten. Samma två som
   DEFAULT_PRODUCT_INFO i ComputerDetails, så förhandsgranskningen
   visar det sidan faktiskt skriver ut och inte en gissning. */
const SECTION_TITLES = ["Game Changer", "Ultimat strålspårning och AI"];

/* Samma uppdelning som produktsidan gör: första stycket blir ett
   avsnitt, resten slås ihop till ett andra. */
const splitIntoSections = (description: string) => {
  const blocks = description
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
  if (blocks.length === 0) return [];
  if (blocks.length === 1) return [{ title: "Produktinfo", body: blocks[0] }];
  const [first, ...rest] = blocks;
  return [
    { title: SECTION_TITLES[0], body: first },
    { title: SECTION_TITLES[1], body: rest.join("\n\n") },
  ];
};

type Props = {
  apiBase: string;
  token: string;
  canWrite: boolean;
  /** Den listning som redigeras, eller null när en ny skapas. */
  listing: Listing | null;
  /** Utkastet för en ny listning, eller null när en befintlig ändras. */
  draft: Listing | null;
  onClose: () => void;
  onSaved: (message: string) => void;
};

export const ListingEditor = ({
  apiBase,
  token,
  canWrite,
  listing,
  draft,
  onClose,
  onSaved,
}: Props) => {
  const isNew = !listing;
  const [form, setForm] = useState<Listing>(() => listing || draft || ({} as Listing));
  /* FPS ligger vid sidan av resten. Formen kommer från servern och
     skickas tillbaka oförändrad, så den hör inte hemma i Listing. */
  const [fps, setFps] = useState<FpsSettings | null>(
    () => ((listing || draft) as unknown as { fps?: FpsSettings })?.fps ?? null,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInput = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setForm(listing || draft || ({} as Listing));
    setFps(((listing || draft) as unknown as { fps?: FpsSettings })?.fps ?? null);
    setError("");
  }, [listing, draft]);

  /* Escape stänger. Ett lager som lägger sig över sidan ska gå att bli
     av med utan att leta efter krysset. */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = <K extends keyof Listing>(key: K, value: Listing[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));


  /* Jämförs mot raden vi öppnade, inte mot ett eget flaggfält. Ett
     fält som ändras fram och tillbaka till samma värde räknas då inte
     som en ändring, vilket är vad man menar när man frågar sig om man
     har sparat. */
  const isDirty = useMemo(
    () => Boolean(listing) && JSON.stringify(form) !== JSON.stringify(listing),
    [form, listing],
  );

  const priceKronor = useMemo(() => Math.round((form.price_cents || 0) / 100), [form.price_cents]);

  const uploadImage = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch(`${apiBase}/api/admin/v2/uploads/product-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      if (!response.ok) {
        throw new Error(await readApiError(response, "Bilden kunde inte laddas upp."));
      }
      const payload = await response.json().catch(() => ({}));
      const url = payload?.data?.url || payload?.url;
      if (!url) throw new Error("Servern gav ingen adress till bilden.");
      setForm((prev) => ({
        ...prev,
        image_url: prev.image_url || url,
        images: [...(prev.images || []), url],
      }));
    } catch (uploadError) {
      setError(errorMessage(uploadError, "Bilden kunde inte laddas upp."));
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const save = async () => {
    if (!form.name?.trim()) {
      setError("Listningen behöver ett namn.");
      return;
    }
    setSaving(true);
    setError("");

    const payload = {
      listing: {
        name: form.name.trim(),
        slug: form.slug || null,
        description: form.description || null,
        image_url: form.image_url || null,
        images: form.images || [],
        price_cents: Math.max(0, Math.round(priceKronor * 100)),
        currency: form.currency || "SEK",
        cpu: form.cpu || "",
        gpu: form.gpu || "",
        ram: form.ram || "",
        storage: form.storage || "",
        storage_type: form.storage_type || "SSD",
        tier: form.tier || "Silver",
        tags: form.tags || [],
        motherboard: form.motherboard || null,
        psu: form.psu || null,
        case_name: form.case_name || null,
        cpu_cooler: form.cpu_cooler || null,
        os: form.os || null,
        use: form.use || null,
        sort_order: form.sort_order,
        quantity_in_stock: Math.max(0, Number(form.quantity_in_stock) || 0),
        is_preorder: Boolean(form.is_preorder),
        eta_note: form.eta_note || null,
        eta_days: form.eta_days,
        /* Bara vid ändring. En ny listning har inget att krocka med. */
        ...(isNew ? {} : { expected_updated_at: form.updated_at }),
      },
      /* Utelämnas när inget rörts, så servern behåller det den har. */
      ...(fps ? { fps } : {}),
    };

    try {
      const response = await fetch(
        isNew ? `${apiBase}/api/admin/v2/listings` : `${apiBase}/api/admin/v2/listings/${form.id}`,
        {
          method: isNew ? "POST" : "PUT",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const code = body?.error?.code;
        if (code === "LISTING_VERSION_CONFLICT") {
          throw new Error(
            "Någon annan har sparat den här listningen under tiden. Stäng och öppna igen så du inte skriver över deras ändring.",
          );
        }
        const fields = body?.error?.details?.fieldErrors;
        const firstField = fields ? Object.keys(fields)[0] : "";
        const firstMessage = firstField ? fields[firstField]?.[0] : "";
        throw new Error(
          firstField && firstMessage
            ? `${body?.error?.message || "Något saknas"} (${firstField}: ${firstMessage})`
            : body?.error?.message || body?.error || "Kunde inte spara.",
        );
      }
      onSaved(isNew ? `${form.name} är skapad.` : `${form.name} är sparad.`);
    } catch (saveError) {
      setError(errorMessage(saveError, "Kunde inte spara."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        onClick={onClose}
        aria-label="Stäng"
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
      />

      <div className="relative z-10 flex h-full w-full max-w-2xl flex-col border-l border-slate-800 bg-[#0f1824] shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-800 px-6 py-4">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-white">
              {isNew ? "Ny listning" : form.name}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              {isNew ? "Fyll i det som ska synas i butiken." : `${formatPrice(form.price_cents)} · ${form.tier || "-"}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Stäng"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 space-y-7 overflow-y-auto px-6 py-6">
          <Group title="Om maskinen">
            <Field label="Namn" required>
              <input className={inputClass} value={form.name || ""} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Pris" hint="kronor, inklusive moms">
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={priceKronor}
                  onChange={(e) => set("price_cents", Math.max(0, Number(e.target.value) || 0) * 100)}
                />
              </Field>
              <Field label="Nivå">
                <select className={inputClass} value={form.tier || ""} onChange={(e) => set("tier", e.target.value)}>
                  {TIERS.map((tier) => (
                    <option key={tier} value={tier}>
                      {tier}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            {/* Texten längst ned på produktsidan.

                Reglen var osynlig: en tom rad delar texten i två
                avsnitt som visas sida vid sida under specifikationen.
                Skrev man ett enda stycke fick man ett avsnitt, skrev
                man två fick man två - utan att någonstans få veta
                varför. Nu står det i fältet, och antalet avsnitt
                räknas fram medan man skriver. */}
            <Field label="Text på produktsidan" hint="Visas under specifikationen">
              <textarea
                rows={6}
                className={`${inputClass} resize-y`}
                value={form.description || ""}
                onChange={(e) => set("description", e.target.value)}
                placeholder={"Första avsnittet.\n\nAndra avsnittet, efter en tom rad."}
              />
            </Field>
            <div className="-mt-2 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs leading-relaxed text-slate-500">
                {(() => {
                  const blocks = (form.description || "")
                    .split(/\n\s*\n/)
                    .map((block) => block.trim())
                    .filter(Boolean);
                  if (blocks.length === 0) {
                    return "Lämnas fältet tomt visas en standardtext i stället.";
                  }
                  if (blocks.length === 1) {
                    return "Ett avsnitt. Lägg en tom rad mitt i texten för att dela den i två.";
                  }
                  return `${blocks.length} stycken blir två avsnitt - det första för sig, resten tillsammans.`;
                })()}
              </p>

              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => setShowPreview((prev) => !prev)
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:border-cyan-400/60 hover:text-cyan-300"
                >
                  <Eye className="h-3.5 w-3.5" />
                  {showPreview ? "Dölj" : "Förhandsgranska"}
                </button>

                {/* Hela sidan, inte bara texten. Den visar allt annat
                    också - bilder, specifikation, pris - men bara det
                    som är sparat. Därför sägs det rakt ut när det
                    finns osparade ändringar. */}
                {!isNew && (
                  <a
                    href={`/computer/${form.slug || form.id}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => {
                      if (isDirty && !window.confirm(
                        "Du har ändringar som inte är sparade. Produktsidan visar det som är sparat, alltså inte dina ändringar. Öppna ändå?",
                      )) {
                        event.preventDefault();
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:border-cyan-400/60 hover:text-cyan-300"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Hela sidan
                  </a>
                )}
              </div>
            </div>

            {/* Avsnitten som produktsidan kommer visa dem, medan man
                skriver. Den riktiga sidan kan bara visa sparad text,
                och att behöva spara för att se hur en formulering
                landar gör att man slutar prova. */}
            {showPreview && (
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Så här visas texten på produktsidan
                </p>
                {splitIntoSections(form.description || "").length === 0 ? (
                  <p className="text-xs italic text-slate-500">
                    Tomt fält. Produktsidan visar sin standardtext i stället.
                  </p>
                ) : (
                  <div className="grid gap-5 sm:grid-cols-2">
                    {splitIntoSections(form.description || "").map((section) => (
                      <div key={section.title}>
                        <h5 className="font-display text-sm font-bold text-slate-100">
                          {section.title}
                        </h5>
                        <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-slate-400">
                          {section.body}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <Field label="Används till" hint="Styr om maskinen syns under Workstation i menyn">
              <div className="flex gap-2">
                {(["gaming", "workstation"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => set("use", value)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${
                      (form.use || "gaming") === value
                        ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-200"
                        : "border-slate-700 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    {value === "gaming" ? "Speldator" : "Arbetsstation"}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Etiketter" hint="Används av filtren på produktsidan">
              <div className="flex flex-wrap gap-2">
                {TAGS.map((tag) => {
                  const active = (form.tags || []).includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        set(
                          "tags",
                          active
                            ? (form.tags || []).filter((t) => t !== tag)
                            : [...(form.tags || []), tag],
                        )
                      }
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                        active
                          ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-200"
                          : "border-slate-700 text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </Field>
          </Group>

          <Group title="Tillgänglighet">
            {/* Valet styr vad kunden ser: ett saldo eller en leveranstid.
                Därför visas bara det fält som hör till det valda läget -
                ett lagerfält på en förbeställning är en fråga utan svar. */}
            <div className="flex gap-2">
              {[
                { value: false, label: "Redo att skickas" },
                { value: true, label: "Förbeställning" },
              ].map((option) => (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => set("is_preorder", option.value)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${
                    Boolean(form.is_preorder) === option.value
                      ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-200"
                      : "border-slate-700 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {form.is_preorder ? (
              <Field label="Leveranstid" hint='Syns som den står. Till exempel "10-14 dagar"'>
                <input
                  className={inputClass}
                  value={form.eta_note || ""}
                  onChange={(e) => set("eta_note", e.target.value)}
                  placeholder="10-14 dagar"
                />
              </Field>
            ) : (
              <Field label="Antal i lager" hint="Noll visas som slutsåld i butiken">
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={form.quantity_in_stock ?? 0}
                  onChange={(e) => set("quantity_in_stock", Math.max(0, Number(e.target.value) || 0))}
                />
              </Field>
            )}
          </Group>

          <Group title="Specifikation">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Processor"><input className={inputClass} value={form.cpu || ""} onChange={(e) => set("cpu", e.target.value)} /></Field>
              <Field label="Grafikkort"><input className={inputClass} value={form.gpu || ""} onChange={(e) => set("gpu", e.target.value)} /></Field>
              <Field label="Minne"><input className={inputClass} value={form.ram || ""} onChange={(e) => set("ram", e.target.value)} /></Field>
              <Field label="Lagring"><input className={inputClass} value={form.storage || ""} onChange={(e) => set("storage", e.target.value)} /></Field>
              <Field label="Lagringstyp">
                <select className={inputClass} value={form.storage_type || "SSD"} onChange={(e) => set("storage_type", e.target.value)}>
                  {STORAGE_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </Field>
              <Field label="Moderkort"><input className={inputClass} value={form.motherboard || ""} onChange={(e) => set("motherboard", e.target.value)} /></Field>
              <Field label="Nätaggregat"><input className={inputClass} value={form.psu || ""} onChange={(e) => set("psu", e.target.value)} /></Field>
              <Field label="Chassi"><input className={inputClass} value={form.case_name || ""} onChange={(e) => set("case_name", e.target.value)} /></Field>
              <Field label="CPU-kylare"><input className={inputClass} value={form.cpu_cooler || ""} onChange={(e) => set("cpu_cooler", e.target.value)} /></Field>
              <Field label="Operativsystem"><input className={inputClass} value={form.os || ""} onChange={(e) => set("os", e.target.value)} /></Field>
            </div>
          </Group>

          <Group title="FPS på produktsidan">
            <FpsEditor value={fps} onChange={setFps} />
          </Group>

          <Group title="Bilder">
            {/* Den första bilden är den kunden möter i listan. Att kunna
                peka ut den utan att ladda om allt är skillnaden mellan
                att byta omslag och att börja om. */}
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {(form.images || []).map((url) => {
                const isPrimary = url === form.image_url;
                return (
                  <div
                    key={url}
                    className={`group relative aspect-[4/3] overflow-hidden rounded-lg border ${
                      isPrimary ? "border-cyan-400" : "border-slate-800"
                    }`}
                  >
                    <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
                    {isPrimary && (
                      <span className="absolute left-1 top-1 rounded bg-cyan-400 px-1.5 py-0.5 text-[10px] font-bold text-slate-950">
                        Huvudbild
                      </span>
                    )}
                    <div className="absolute inset-0 flex items-end justify-between gap-1 bg-gradient-to-t from-slate-950/90 to-transparent p-1 opacity-0 transition-opacity group-hover:opacity-100">
                      {!isPrimary && (
                        <button
                          type="button"
                          onClick={() => set("image_url", url)}
                          className="rounded bg-slate-900/90 px-1.5 py-1 text-[10px] font-semibold text-cyan-300"
                        >
                          Gör till huvudbild
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => {
                            const images = (prev.images || []).filter((i) => i !== url);
                            return {
                              ...prev,
                              images,
                              image_url: prev.image_url === url ? images[0] || null : prev.image_url,
                            };
                          })
                        }
                        className="ml-auto rounded bg-slate-900/90 p-1 text-rose-300"
                        aria-label="Ta bort bilden"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
                className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-700 text-slate-500 hover:border-cyan-400/60 hover:text-cyan-300 disabled:opacity-50"
              >
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                <span className="text-[11px] font-semibold">{uploading ? "Laddar upp" : "Lägg till"}</span>
              </button>
            </div>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadImage(file);
              }}
            />
          </Group>
        </div>

        <footer className="space-y-3 border-t border-slate-800 px-6 py-4">
          {error && (
            <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:border-slate-600"
            >
              Avbryt
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving || !canWrite}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isNew ? "Skapa listning" : "Spara"}
            </button>
          </div>
          {!canWrite && (
            <p className="text-right text-xs text-slate-500">
              Din behörighet är läsbehörighet, så sparaknappen är avstängd.
            </p>
          )}
        </footer>
      </div>
    </div>
  );
};

const inputClass =
  "w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-400/60 focus:outline-none";

const Group = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="space-y-4">
    <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{title}</h4>
    {children}
  </section>
);

const Field = ({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) => (
  <label className="block">
    <span className="mb-1.5 block text-xs font-semibold text-slate-300">
      {label}
      {required && <span className="text-cyan-300"> *</span>}
      {hint && <span className="ml-1.5 font-normal text-slate-500">{hint}</span>}
    </span>
    {children}
  </label>
);
