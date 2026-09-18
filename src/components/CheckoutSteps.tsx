import { Check } from "lucide-react";

/**
 * Var i köpet man befinner sig: kundvagn, kassa, klart.
 *
 * Varukorgen, kassan och kvittot var tre sidor utan något som band ihop
 * dem. Man visste inte hur många steg som återstod, och det är precis
 * den osäkerheten som får folk att avbryta ett köp - inte priset, utan
 * att man inte ser slutet.
 *
 * Tre steg är också ärligt: det ÄR tre sidor. En indikator som visar
 * fler steg än det finns, eller som står kvar på samma siffra i två
 * vyer, är värre än ingen alls.
 *
 * Avklarade steg får en bock och sidans kulör, det man står på får en
 * ring omkring sig, och det som återstår ligger nedtonat. Formen är
 * densamma på telefon - bara etiketterna krymper - eftersom en
 * indikator som göms på liten skärm inte hjälper någon.
 */

const STEPS = ["Kundvagn", "Kassa", "Klart"] as const;

export type CheckoutStep = 1 | 2 | 3;

export const CheckoutSteps = ({
  current,
  accent = "#3FD9F5",
}: {
  /** 1 = kundvagn, 2 = kassa, 3 = kvitto. */
  current: CheckoutStep;
  accent?: string;
}) => (
  <ol className="flex items-center gap-2 sm:gap-3" aria-label="Steg i köpet">
    {STEPS.map((label, index) => {
      const step = index + 1;
      const done = step < current;
      const active = step === current;

      return (
        <li key={label} className="flex items-center gap-2 sm:gap-3">
          <span
            className="flex items-center gap-2"
            aria-current={active ? "step" : undefined}
          >
            <span
              aria-hidden="true"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold tabular-nums transition-colors"
              style={{
                borderColor: done || active ? accent : "hsl(var(--foreground) / 0.25)",
                backgroundColor: done ? accent : "transparent",
                color: done
                  ? "hsl(var(--background))"
                  : active
                    ? accent
                    : "hsl(var(--muted-foreground))",
                boxShadow: active ? `0 0 0 3px ${accent}26` : undefined,
              }}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : step}
            </span>
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.16em] sm:text-xs"
              style={{
                color: active
                  ? "hsl(var(--foreground))"
                  : "hsl(var(--muted-foreground))",
              }}
            >
              {label}
            </span>
          </span>

          {/* Strecket mellan stegen tänds när steget är passerat. */}
          {step < STEPS.length && (
            <span
              aria-hidden="true"
              className="h-px w-5 sm:w-10"
              style={{
                backgroundColor: done ? accent : "hsl(var(--foreground) / 0.2)",
              }}
            />
          )}
        </li>
      );
    })}
  </ol>
);

export default CheckoutSteps;
