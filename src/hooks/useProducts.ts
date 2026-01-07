import { useEffect, useState } from 'react';
import { getProducts } from '@/lib/supabaseServices';

export interface SupabaseProduct {
  id: string; // UUID
  legacy_id?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  price_cents: number;
  cpu: string;
  gpu: string;
  ram: string;
  storage: string;
  storage_type: string;
  tier: string;
  rating: number;
  reviews_count: number;
  motherboard?: string | null;
  psu?: string | null;
  case_name?: string | null;
  cpu_cooler?: string | null;
  os?: string | null;
  dlss_multiplier?: number | null;
  frame_gen_multiplier?: number | null;
}

let productCache: SupabaseProduct[] = [];
let productMapCache: { [key: string]: string } = {}; // name -> UUID mapping

export const normalizeProductKey = (value: string) => {
  if (!value) return "";
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2012-\u2015\u2212]/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export async function loadProducts() {
  if (productCache.length === 0) {
    try {
      productCache = await getProducts();
      // Create mapping by tier and name for easy lookup
      productCache.forEach((product) => {
        if (product.legacy_id) {
          const legacyKey = normalizeProductKey(product.legacy_id);
          if (legacyKey) {
            productMapCache[legacyKey] = product.id;
          }
        }
        const nameKey = normalizeProductKey(product.name);
        if (nameKey) {
          productMapCache[nameKey] = product.id;
        }
        const slugKey = normalizeProductKey(product.slug);
        if (slugKey) {
          productMapCache[slugKey] = product.id;
        }
      });
    } catch (error) {
      console.error('Failed to load products from Supabase:', error);
    }
  }
  return productCache;
}

export function getProductIdByName(name: string): string | null {
  const key = normalizeProductKey(name);
  if (!key) return null;
  return productMapCache[key] || null;
}

export function useProducts() {
  const [products, setProducts] = useState<SupabaseProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await loadProducts();
        setProducts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load products');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return { products, loading, error };
}

// Helper: Get Supabase ID for a local product ID
export function getSupabaseProductId(localId: string, computersByTier: any[]): string | null {
  // This is a fallback - normally you'd use the products hook
  // For now, map by position or name
  return null;
}
