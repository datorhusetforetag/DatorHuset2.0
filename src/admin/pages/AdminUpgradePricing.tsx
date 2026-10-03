import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";

import { AdminAccessContext } from "../useAdminAccess";
import { errorMessage } from "@/lib/utils";
import { readApiError } from "../apiError";
import { invalidateUpgradePricing } from "@/hooks/useUpgradePricing";
import {
  BASE_CONFIGS,
  DEFAULT_UPGRADE_PRICING,
  formatRam,
  formatStorage,
  getUpgradeOptions,
  normalizePricing,
} from "../../../shared/upgradePricing.js";

/**
 * Uppgraderingspriser.
 *
 * Stegpriserna för minne och lagring, och grafikkortsvalen per dator.
 * Komponentpriserna svänger, så tabellen är byggd för att ändras ofta -
 * ungefär en gång i veckan - utan att någon kod behöver röras.
 *
 * Det som sparas här gäller direkt: på produktsidan, på korten på
 * startsidan och i kassan, som räknar om priset ur samma tabell när
 * kunden betalar. Kunder som redan lagt en dator i varukorgen betalar
 * alltså det pris som gäller när de går till kassan, inte när de lade den
 * dit.
 *
 * Stegen läggs ihop: 512GB -> 2TB kostar båda stegen. Går kunden ned ett
 * steg dras samma belopp av. Reglerna står i shared/upgradePricing.js.
 *
 * Förhandsvisningen längst ned visar vad varje dator får för val och
 * tillägg med priserna som står i formuläret just nu, innan man sparar.
 */

type Pricing = ReturnType<typeof normalizePricing>;
type GpuOption = { id: string; label: string; price: number };

const STORAGE_STEPS = [
  { key: "512-1000", label: "512GB → 1TB" },
  { key: "1000-2000", label: "1TB → 2TB" },
  { key: "2000-4000", label: "2TB → 4TB" },
] as const;

const RAM_STEPS = [
  { key: "16-32", label: "16GB → 32GB" },
  { key: "32-64", label: "32GB → 64GB" },
] as const;

const delta = (value: number) =>
  value === 0 ? "ingår" : `${value > 0 ? "+" : "−"}${Math.abs(value).toLocaleString("sv-SE")} kr`;

const inputClass =
  "w-28 rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-right text-sm tabular-nums text-slate-100 focus:border-cyan-400/60 focus:outline-none disabled:opacity-60";

const PriceInput = ({
  value,
  onChange,
  disabled,
  label,
}: {
  value: number;
  onChange: (next: number) => void;
  disabled: boolean;
  label: string;
}) => (
  <label className="flex items-center justify-between gap-4 border-b border-slate-800/70 py-3 last:border-b-0">
    <span className="text-sm text-slate-300">{label}</span>
    <span className="flex items-center gap-2">
      <span className="text-sm text-slate-500">+</span>
      <input
        type="number"
        min={0}
        step={50}
        inputMode="numeric"
        value={Number.isFinite(value) ? value : 0}
        disabled={disabled}
        onChange={(event) => onChange(Math.max(0, Math.round(Number(event.target.value) || 0)))}
        className={inputClass}
      />
      <span className="text-sm text-slate-500">kr</span>
    </span>
  </label>
);

export default function AdminUpgradePricing() {
  const { token, apiBase, role } = useOutletContext<AdminAccessContext>();
  const canWrite = role === "admin" || role === "ops";

  const [pricing, setPricing] = useState<Pricing>(() => normalizePricing(DEFAULT_UPGRADE_PRICING));
  const [saved, setSaved] = useState<Pricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiBase}/api/upgrade-pricing`);
      if (!response.ok) throw new Error(await readApiError(response, "Kunde inte hämta pristabellen."));
      const payload = await response.json().catch(() => ({}));
      const next = normalizePricing(payload?.data || DEFAULT_UPGRADE_PRICING);
      setPricing(next);
      setSaved(next);
    } catch (loadError) {
      setError(errorMessage(loadError, "Kunde inte hämta pristabellen."));
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty = useMemo(() => JSON.stringify(pricing) !== JSON.stringify(saved), [pricing, saved]);

  const save = async () => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${apiBase}/api/admin/v2/upgrade-pricing`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ pricing }),
      });
      if (!response.ok) throw new Error(await readApiError(response, "Kunde inte spara pristabellen."));
      const payload = await response.json().catch(() => ({}));
      const next = normalizePricing(payload?.data || pricing);
      setPricing(next);
      setSaved(next);
      invalidateUpgradePricing();
      setNotice("Sparat. De nya priserna gäller direkt på sajten och i kassan.");
    } catch (saveError) {
      setError(errorMessage(saveError, "Kunde inte spara pristabellen."));
    } finally {
      setSaving(false);
    }
  };

  const setStorage = (key: string, value: number) =>
    setPricing((prev) => ({ ...prev, storage: { ...prev.storage, [key]: value } }));
  const setRam = (type: "DDR4" | "DDR5", key: string, value: number) =>
    setPricing((prev) => ({ ...prev, ram: { ...prev.ram, [type]: { ...prev.ram[type], [key]: value } } }));

  /* Egna stegpriser för en dator. Ett tomt fält betyder standardpriset. */
  type OverrideGroup = "storage" | "ram";
  const overrideFor = (computerId: string, group: OverrideGroup, key: string): number | undefined =>
    (pricing.overrides?.[computerId]?.[group] as Record<string, number> | undefined)?.[key];
  const setOverride = (computerId: string, group: OverrideGroup, key: string, value: number | null) =>
    setPricing((prev) => {
      const overrides = { ...(prev.overrides || {}) };
      const current = { ...(overrides[computerId] || {}) };
      const steps = { ...((current[group] as Record<string, number>) || {}) };
      if (value === null) delete steps[key];
      else steps[key] = value;
      if (Object.keys(steps).length > 0) current[group] = steps;
      else delete current[group];
      if (Object.keys(current).length > 0) overrides[computerId] = current;
      else delete overrides[computerId];
      return { ...prev, overrides };
    });

  const gpuFor = (computerId: string): GpuOption[] => (pricing.gpu?.[computerId] as GpuOption[]) || [];
  const setGpu = (computerId: string, options: GpuOption[]) =>
    setPricing((prev) => {
      const gpu = { ...prev.gpu };
      if (options.length > 0) gpu[computerId] = options;
      else delete gpu[computerId];
      return { ...prev, gpu };
    });

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 px-6 py-12 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        Hämtar pristabellen...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Uppgraderingspriser</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Vad det kostar att uppgradera minne och lagring, och vilka grafikkort som går att välja.
            Stegen läggs ihop, och ett steg ned dras av med samma belopp. Ändringar gäller direkt på
            sajten och i kassan.
          </p>
          {saved?.updatedAt && (
            <p className="mt-1 text-xs text-slate-500">
              Senast ändrad {new Date(saved.updatedAt).toLocaleString("sv-SE")}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => void save()}
          disabled={!canWrite || saving || !dirty}
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {dirty ? "Spara priser" : "Sparat"}
        </button>
      </header>

      {!canWrite && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Du har läsbehörighet. Be en administratör ändra priserna.
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>
      )}
      {notice && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {notice}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 px-5 py-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Lagring</h3>
          <div className="mt-2">
            {STORAGE_STEPS.map((step) => (
              <PriceInput
                key={step.key}
                label={step.label}
                value={pricing.storage[step.key]}
                disabled={!canWrite}
                onChange={(value) => setStorage(step.key, value)}
              />
            ))}
          </div>
        </section>

        {(["DDR4", "DDR5"] as const).map((type) => (
          <section key={type} className="rounded-2xl border border-slate-800 bg-slate-900/40 px-5 py-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Minne {type}</h3>
            <div className="mt-2">
              {RAM_STEPS.map((step) => (
                <PriceInput
                  key={step.key}
                  label={step.label}
                  value={pricing.ram[type][step.key]}
                  disabled={!canWrite}
                  onChange={(value) => setRam(type, step.key, value)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Per dator: förhandsvisning av valen, och grafikkortsvalen. */}
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
        <div className="border-b border-slate-800 px-5 py-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Per dator</h3>
          <p className="mt-1 text-sm text-slate-400">
            Valen kunden ser med priserna ovan. Grafikkort läggs till per dator, med tillägget mot datorns
            eget kort.
          </p>
        </div>

        {BASE_CONFIGS.map((config) => {
          const options = getUpgradeOptions(config, pricing);
          const gpuOptions = gpuFor(config.computerId);
          return (
            <div key={config.computerId} className="border-b border-slate-800/70 px-5 py-4 last:border-b-0">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-slate-100">{config.names[0]}</p>
                <p className="text-xs text-slate-500">
                  Grund: {formatRam(config.ram.gb, config.ram.type)} · {formatStorage(config.storageGb)}
                </p>
              </div>

              <div className="mt-2 grid gap-1 text-xs text-slate-400 sm:grid-cols-2">
                <p>
                  <span className="text-slate-500">Minne: </span>
                  {options.ram.map((option) => `${option.gb}GB ${delta(option.price)}`).join(" · ")}
                </p>
                <p>
                  <span className="text-slate-500">Lagring: </span>
                  {options.storage.map((option) => `${option.label} ${delta(option.price)}`).join(" · ")}
                </p>
              </div>

              {/* Egna stegpriser. Bara de steg datorn faktiskt använder visas.
                  Tomt fält = standardpriset, som står som grå platshållare. */}
              {(() => {
                const usedSteps = (group: OverrideGroup, tiers: number[], steps: readonly { key: string; label: string }[]) => {
                  const lowest = Math.min(...tiers);
                  const highest = Math.max(...tiers);
                  return steps.filter((step) => {
                    const [from, to] = step.key.split("-").map(Number);
                    return from >= lowest && to <= highest;
                  }).map((step) => ({ ...step, group }));
                };
                const fields = [
                  ...usedSteps("ram", options.ram.map((o) => o.gb), RAM_STEPS).map((step) => ({
                    ...step,
                    label: `${config.ram.type} ${step.label}`,
                    standard: pricing.ram[config.ram.type][step.key],
                  })),
                  ...usedSteps("storage", options.storage.map((o) => o.gb), STORAGE_STEPS).map((step) => ({
                    ...step,
                    standard: pricing.storage[step.key],
                  })),
                ];
                const hasOverride = fields.some((field) => overrideFor(config.computerId, field.group, field.key) !== undefined);
                return (
                  <details className="mt-3 rounded-lg border border-slate-800 bg-slate-950/30" open={hasOverride || undefined}>
                    <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-slate-300">
                      Egna priser för den här datorn{hasOverride ? " (används)" : ""}
                    </summary>
                    <div className="grid gap-x-6 px-3 pb-2 sm:grid-cols-2">
                      {fields.map((field) => {
                        const value = overrideFor(config.computerId, field.group, field.key);
                        return (
                          <label
                            key={`${field.group}-${field.key}`}
                            className="flex items-center justify-between gap-3 border-b border-slate-800/70 py-2 last:border-b-0"
                          >
                            <span className="text-xs text-slate-400">{field.label}</span>
                            <span className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">+</span>
                              <input
                                type="number"
                                min={0}
                                step={50}
                                inputMode="numeric"
                                value={value ?? ""}
                                placeholder={String(field.standard)}
                                disabled={!canWrite}
                                onChange={(event) => {
                                  const raw = event.target.value.trim();
                                  setOverride(
                                    config.computerId,
                                    field.group,
                                    field.key,
                                    raw === "" ? null : Math.max(0, Math.round(Number(raw) || 0)),
                                  );
                                }}
                                className={`${inputClass} ${value !== undefined ? "border-cyan-400/60" : ""}`}
                              />
                              <span className="text-xs text-slate-500">kr</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    <p className="px-3 pb-3 text-[11px] text-slate-500">
                      Lämna tomt för att använda standardpriset (grått). Ett eget pris gäller bara den här datorn.
                    </p>
                  </details>
                );
              })()}

              <div className="mt-3 space-y-2">
                {gpuOptions.map((option, index) => (
                  <div key={option.id} className="flex flex-wrap items-center gap-2">
                    <input
                      value={option.label}
                      disabled={!canWrite}
                      placeholder="Grafikkort, t.ex. RTX 5080 16GB"
                      onChange={(event) => {
                        const next = [...gpuOptions];
                        next[index] = { ...option, label: event.target.value.slice(0, 80) };
                        setGpu(config.computerId, next);
                      }}
                      className="min-w-0 flex-1 rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400/60 focus:outline-none disabled:opacity-60"
                    />
                    <span className="text-sm text-slate-500">+</span>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={option.price}
                      disabled={!canWrite}
                      onChange={(event) => {
                        const next = [...gpuOptions];
                        next[index] = { ...option, price: Math.max(0, Math.round(Number(event.target.value) || 0)) };
                        setGpu(config.computerId, next);
                      }}
                      className={inputClass}
                    />
                    <span className="text-sm text-slate-500">kr</span>
                    <button
                      type="button"
                      disabled={!canWrite}
                      onClick={() => setGpu(config.computerId, gpuOptions.filter((_, i) => i !== index))}
                      aria-label={`Ta bort ${option.label}`}
                      className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-800 hover:text-rose-300 disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {canWrite && gpuOptions.length < 6 && (
                  <button
                    type="button"
                    onClick={() => {
                      /* Id:t sätts en gång och följer sedan med valet, även
                         om etiketten ändras - en vara i någons varukorg
                         pekar på id:t. */
                      const id = `gpu-${Date.now().toString(36)}`;
                      setGpu(config.computerId, [...gpuOptions, { id, label: "", price: 0 }]);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300 hover:text-cyan-200"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Lägg till grafikkortsval
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </section>

      <p className="text-xs text-slate-500">
        Grafikkortsval utan namn sparas inte. Ett grafikkortsval som tas bort försvinner också ur varukorgar där
        det redan valts - kassan ber då kunden välja om.
      </p>
    </div>
  );
}
