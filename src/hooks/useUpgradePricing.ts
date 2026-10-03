import { useEffect, useState } from "react";

import { DEFAULT_UPGRADE_PRICING, normalizePricing } from "../../shared/upgradePricing.js";

/**
 * Pristabellen för uppgraderingar, som adminläget senast sparade den.
 *
 * Hämtas en gång per sidladdning och delas mellan alla som frågar - kort,
 * produktsida och varukorg ska visa samma pris. Svarar inte servern visas
 * reservtabellen ur koden; kassan räknar ändå alltid om med den tabell
 * som faktiskt gäller, så ett gammalt pris här kan aldrig debiteras.
 */

export type UpgradePricing = ReturnType<typeof normalizePricing>;

let cached: UpgradePricing | null = null;
let pending: Promise<UpgradePricing> | null = null;

const load = (): Promise<UpgradePricing> => {
  if (cached) return Promise.resolve(cached);
  if (!pending) {
    const apiBase = import.meta.env.VITE_API_BASE_URL || "";
    pending = fetch(`${apiBase}/api/upgrade-pricing`)
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => normalizePricing(payload?.data || DEFAULT_UPGRADE_PRICING))
      .catch(() => normalizePricing(DEFAULT_UPGRADE_PRICING))
      .then((pricing) => {
        cached = pricing;
        return pricing;
      });
  }
  return pending;
};

/** Glöm tabellen, så nästa fråga hämtar den på nytt (efter att admin sparat). */
export const invalidateUpgradePricing = () => {
  cached = null;
  pending = null;
};

export const useUpgradePricing = () => {
  const [pricing, setPricing] = useState<UpgradePricing>(cached ?? normalizePricing(DEFAULT_UPGRADE_PRICING));
  const [loaded, setLoaded] = useState(Boolean(cached));

  useEffect(() => {
    let active = true;
    load().then((next) => {
      if (!active) return;
      setPricing(next);
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

  return { pricing, loaded };
};
