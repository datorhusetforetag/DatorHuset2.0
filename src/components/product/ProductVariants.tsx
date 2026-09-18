/**
 * Utförandena av datorn, som kort bredvid varandra.
 *
 * Förlagan har tre kort - Core, Pro, Elite - där man ser namn, vad som
 * skiljer dem åt och priset på en gång. Det som fanns här tidigare var
 * en liten vippknapp mellan "Nya delar" och "Begagnade delar", nedtryckt
 * bland brödtexten. Det är samma val, men som vippknapp syntes det inte
 * att priset ändrades, och som kort gör det det.
 *
 * VARJE KORT ÄR EN RIKTIG PRODUKT. Priset kommer ur produkten i
 * Supabase och kortet byter vilken produkt som hamnar i varukorgen.
 * Det är inte en detalj utan hela konstruktionen: varukorgen tar ett
 * produkt-id och ett antal, så ett pristillägg som bara fanns i den här
 * vyn hade visats på sidan men aldrig följt med till kassan. Se
 * ComputerUpgrade i src/data/computers.ts.
 *
 * Finns bara ett utförande ritas ingenting. Ett val med ett alternativ
 * är inte ett val.
 */

export type VariantCard = {
  id: string;
  label: string;
  /** Det som skiljer utförandet från de andra, till exempel "64GB DDR5". */
  detail?: string;
  price: number;
  /** Överstruket jämförpris, när utförandet är billigare än grundpriset. */
  comparePrice?: number;
};

type ProductVariantsProps = {
  options: VariantCard[];
  selectedId: string;
  onSelect: (id: string) => void;
  accent: string;
};

const formatPrice = (value: number) =>
  `${value.toLocaleString("sv-SE", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  })} kr`;

export const ProductVariants = ({
  options,
  selectedId,
  onSelect,
  accent,
}: ProductVariantsProps) => {
  if (options.length < 2) return null;

  return (
    <fieldset>
      <legend className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
        Välj utförande
      </legend>

      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {options.map((option) => {
          const active = option.id === selectedId;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              aria-pressed={active}
              className="rounded-sm border p-4 text-left transition-colors"
              style={{
                borderColor: active ? accent : "hsl(var(--foreground) / 0.15)",
                backgroundColor: active ? `${accent}12` : "transparent",
                boxShadow: active ? `0 0 0 1px ${accent}` : undefined,
              }}
            >
              <span
                className="block text-sm font-bold"
                style={{ color: active ? accent : "hsl(var(--foreground))" }}
              >
                {option.label}
              </span>

              {option.detail && (
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {option.detail}
                </span>
              )}

              <span className="mt-3 flex flex-wrap items-baseline gap-2">
                <span className="font-display text-base font-bold tabular-nums text-foreground">
                  {formatPrice(option.price)}
                </span>
                {typeof option.comparePrice === "number" &&
                  option.comparePrice > option.price && (
                    <span className="text-xs text-muted-foreground line-through">
                      {formatPrice(option.comparePrice)}
                    </span>
                  )}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
};

export default ProductVariants;
