import { useEffect, useMemo, useState } from "react";

import { COMPUTERS, type Computer } from "@/data/computers";
import { DATORHUSETS_VAL } from "@/data/showcase";
import { normalizeProductKey, useProducts } from "@/hooks/useProducts";
import { buildProductLookup, getProductFromLookup, mergeProductFields } from "@/lib/productOverrides";
import { getAllInventory, getArchivedProductKeys } from "@/lib/supabaseServices";

/**
 * Datorerna till startsidans två rader: det som står i lager, och
 * DatorHusets val.
 *
 * Samma källor som produktsidan: grundlistan i src/data/computers.ts,
 * namn och pris ur databasen där de är ändrade, arkiverade listningar
 * bortfiltrerade, och lagret ur inventeringen. Produktsidan har mycket
 * mer - filter, begagnade varianter, listningar som bara finns i
 * databasen - men inget av det behövs för två rader på startsidan.
 */

export type ShowcaseComputer = {
  computer: Computer;
  productId: string | null;
  name: string;
  price: number;
  cpu: string;
  gpu: string;
  ram: string;
  storage: string;
  inStock: boolean;
  canPreorder: boolean;
};

type InventoryEntry = {
  product_id: string;
  quantity_in_stock: number;
  is_preorder?: boolean | null;
  allow_preorder?: boolean | null;
};

export const useShowcaseComputers = () => {
  const { products } = useProducts();
  const [inventory, setInventory] = useState<Record<string, InventoryEntry>>({});
  const [inventoryLoaded, setInventoryLoaded] = useState(false);
  const [archived, setArchived] = useState<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    getAllInventory()
      .then((items) => {
        if (!active) return;
        const next: Record<string, InventoryEntry> = {};
        items.forEach((item) => {
          if (item?.product_id) next[item.product_id] = item as InventoryEntry;
        });
        setInventory(next);
      })
      .catch(() => {
        /* Utan lagerdata visas raden "I lager" som tom, inte som fel. */
      })
      .finally(() => {
        if (active) setInventoryLoaded(true);
      });

    getArchivedProductKeys()
      .then((keys) => {
        if (active) setArchived(new Set(keys.map((key) => normalizeProductKey(key)).filter(Boolean)));
      })
      .catch(() => {
        /* Kan vi inte läsa listan visar vi hellre allt än inget. */
      });

    return () => {
      active = false;
    };
  }, []);

  const all = useMemo<ShowcaseComputer[]>(() => {
    const lookup = buildProductLookup(products);
    const idByName = new Map<string, string>();
    products.forEach((product) => {
      const nameKey = normalizeProductKey(product.name);
      if (nameKey) idByName.set(nameKey, product.id);
      const slugKey = product.slug ? normalizeProductKey(product.slug) : "";
      if (slugKey) idByName.set(slugKey, product.id);
    });

    return COMPUTERS.filter(
      (computer) =>
        ![computer.id, computer.name].some((value) => archived.has(normalizeProductKey(String(value)))),
    ).map((computer) => {
      const productId =
        idByName.get(normalizeProductKey(computer.name)) || idByName.get(normalizeProductKey(computer.id));
      const product = getProductFromLookup(lookup, productId);
      const merged = mergeProductFields(
        {
          name: computer.name,
          price: computer.price,
          cpu: computer.cpu,
          gpu: computer.gpu,
          ram: computer.ram,
          storage: computer.storage,
          storagetype: computer.storagetype,
          tier: computer.tier,
        },
        product,
      );
      const stock = productId ? inventory[productId] : undefined;

      return {
        computer,
        productId: productId ?? null,
        name: product?.name || computer.name,
        price: merged.price,
        cpu: merged.cpu,
        gpu: merged.gpu,
        ram: merged.ram,
        storage: merged.storage,
        inStock: (stock?.quantity_in_stock ?? 0) > 0,
        canPreorder: Boolean(stock?.is_preorder ?? stock?.allow_preorder),
      };
    });
  }, [products, inventory, archived]);

  const inStock = useMemo(() => all.filter((item) => item.inStock), [all]);

  const picks = useMemo(
    () =>
      DATORHUSETS_VAL.map((id) => all.find((item) => item.computer.id === id)).filter(
        (item): item is ShowcaseComputer => Boolean(item),
      ),
    [all],
  );

  return { inStock, picks, inventoryLoaded };
};
