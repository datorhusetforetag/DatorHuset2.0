import { SupabaseProduct, normalizeProductKey } from "@/hooks/useProducts";

export type ProductOverrideFields = {
  name: string;
  price: number;
  cpu: string;
  gpu: string;
  ram: string;
  storage: string;
  storagetype: string;
  tier: string;
  description?: string;
  motherboard?: string;
  psu?: string;
  caseName?: string;
  cpuCooler?: string;
  os?: string;
};

export const buildProductLookup = (products: SupabaseProduct[]) => {
  const lookup = new Map<string, SupabaseProduct>();
  products.forEach((product) => {
    if (!product) return;
    if (product.id) {
      lookup.set(product.id, product);
    }
    if (product.name) {
      lookup.set(normalizeProductKey(product.name), product);
    }
    if (product.slug) {
      lookup.set(normalizeProductKey(product.slug), product);
    }
    if (product.legacy_id) {
      lookup.set(normalizeProductKey(product.legacy_id), product);
    }
  });
  return lookup;
};

export const getProductFromLookup = (lookup: Map<string, SupabaseProduct>, key?: string | null) => {
  if (!key) return null;
  const direct = lookup.get(key);
  if (direct) return direct;
  return lookup.get(normalizeProductKey(key)) || null;
};

export const mergeProductFields = (
  fallback: ProductOverrideFields,
  product?: SupabaseProduct | null
): ProductOverrideFields => ({
  name: product?.name || fallback.name,
  price: typeof product?.price_cents === "number" ? product.price_cents / 100 : fallback.price,
  cpu: product?.cpu || fallback.cpu,
  gpu: product?.gpu || fallback.gpu,
  ram: product?.ram || fallback.ram,
  storage: product?.storage || fallback.storage,
  storagetype: product?.storage_type || fallback.storagetype,
  tier: product?.tier || fallback.tier,
  description: product?.description || fallback.description,
  motherboard: product?.motherboard || fallback.motherboard,
  psu: product?.psu || fallback.psu,
  caseName: product?.case_name || fallback.caseName,
  cpuCooler: product?.cpu_cooler || fallback.cpuCooler,
  os: product?.os || fallback.os,
});
