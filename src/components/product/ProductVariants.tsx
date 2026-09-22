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
  /** Rubriken kortet hamnar under. Utelämnat betyder grundutförande. */
  group?: "storage" | "performance" | "ram" | "other";
};

/*
 * Rubrikerna, i den ordning de visas.
 *
 * Grundutförandet först - man väljer skick innan man väljer delar.
 * Sedan prestanda, lagring och minne, vilket är ordningen folk
 * frågar om dem i.
 */
const GROUPS = [
  { key: "base", title: "Utförande" },
  { key: "performance", title: "Processor och grafikkort" },
  { key: "storage", title: "Lagring" },
  { key: "ram", title: "Minne" },
  { key: "other", title: "Övrigt" },
] as const;

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

  /* Korten läggs under sin rubrik. Ett kort utan grupp är ett
     grundutförande - nytt eller begagnat - och hamnar överst. */
  const byGroup = GROUPS.map((group) => ({
    ...group,
    cards: options.filter((option) =>
      group.key === "base" ? !option.group : option.group === group.key,
    ),
  })).filter((group) => group.cards.length > 0);

  return (
    <div className="space-y-5">
      {byGroup.map((group) => (
        <fieldset key={group.key}>
          <legend className="panel-label">{group.title}</legend>

          {/*
            Två kolumner, inte tre.
            I panelens bredd blev tre kort så smala att etiketten bröts
            på mitten, och ett kort vars rubrik radbryts läses som två.
          */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            {group.cards.map((option) => {
              const active = option.id === selectedId;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onSelect(option.id)}
                  aria-pressed={active}
                  className="rounded-sm border px-3.5 py-3 text-left transition-colors"
                  style={{
                    borderColor: active
                      ? accent
                      : "hsl(var(--foreground) / 0.14)",
                    backgroundColor: active ? `${accent}12` : "transparent",
                  }}
                >
                  <span
                    className="block text-[13px] font-bold leading-snug"
                    style={{
                      color: active ? accent : "hsl(var(--foreground))",
                    }}
                  >
                    {option.label}
                  </span>

                  {/* Underrubriken ryker när kortet inte är valt.
                  Den förklarar vad man väljer, och det behöver man bara
                  veta om det man står på - fyra rader småtext under fyra
                  kort är precis den sortens brus panelen inte tål. */}
                  {option.detail && active && (
                    <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                      {option.detail}
                    </span>
                  )}

                  <span className="mt-2 flex flex-wrap items-baseline gap-1.5">
                    <span className="text-sm font-bold tabular-nums text-foreground">
                      {formatPrice(option.price)}
                    </span>
                    {typeof option.comparePrice === "number" &&
                      option.comparePrice > option.price && (
                        <span className="text-[11px] text-muted-foreground line-through">
                          {formatPrice(option.comparePrice)}
                        </span>
                      )}
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

export default ProductVariants;
