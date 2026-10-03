/**
 * Välj minne, lagring och grafikkort på produktsidan.
 *
 * Samma kortform som ProductVariants ovanför, så de läses som en och
 * samma sak. Skillnaden är var priset kommer ifrån: ProductVariants byter
 * produkt, medan valen här räknas ur pristabellen för uppgraderingar
 * (shared/upgradePricing.js) och läggs på datorns pris. Kassan räknar om
 * samma tillägg på servern, så det som står här är det som debiteras.
 *
 * Varje kort visar tillägget mot grundutförandet - "+1 500 kr", "−1 500 kr"
 * eller "Ingår" - och inte totalpriset. Det är tillägget man väger;
 * totalen står redan överst på sidan och ändras när man väljer.
 */

export type PickerOption = {
  value: string;
  label: string;
  price: number;
  isBase?: boolean;
};

export type PickerGroup = {
  key: string;
  title: string;
  options: PickerOption[];
  selected: string;
  onSelect: (value: string) => void;
};

const formatDelta = (price: number) => {
  if (price === 0) return "Ingår";
  const amount = Math.abs(price).toLocaleString("sv-SE");
  return price > 0 ? `+${amount} kr` : `−${amount} kr`;
};

export const ConfigurationPicker = ({ groups, accent }: { groups: PickerGroup[]; accent: string }) => {
  /* En grupp med ett enda alternativ är inget val och ritas inte. */
  const visible = groups.filter((group) => group.options.length > 1);
  if (visible.length === 0) return null;

  return (
    <div className="space-y-5">
      {visible.map((group) => (
        <fieldset key={group.key}>
          <legend className="panel-label">{group.title}</legend>
          <div className={`mt-3 grid gap-2 ${group.options.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
            {group.options.map((option) => {
              const active = option.value === group.selected;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => group.onSelect(option.value)}
                  aria-pressed={active}
                  className="rounded-sm border px-3 py-3 text-left transition-colors"
                  style={{
                    borderColor: active ? accent : "hsl(var(--foreground) / 0.14)",
                    backgroundColor: active ? `${accent}12` : "transparent",
                  }}
                >
                  <span
                    className="block text-[13px] font-bold leading-snug"
                    style={{ color: active ? accent : "hsl(var(--foreground))" }}
                  >
                    {option.label}
                  </span>
                  <span
                    className={`mt-1.5 block text-[12px] font-semibold tabular-nums ${
                      option.price === 0 ? "text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    {formatDelta(option.price)}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
};

export default ConfigurationPicker;
