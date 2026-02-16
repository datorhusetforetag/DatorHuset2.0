import { COMPUTERS } from "@/data/computers";

type ProductLike = {
  id?: string | number | null;
  legacy_id?: string | number | null;
  name?: string | null;
  slug?: string | null;
  image_url?: string | null;
  image?: string | null;
  imageUrl?: string | null;
};

const normalize = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return "";
  return String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2012-\u2015\u2212]/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const imageByKey = new Map<string, string>();

const addImageKey = (key: string | number | null | undefined, image: string) => {
  const normalized = normalize(key);
  if (!normalized) return;
  imageByKey.set(normalized, image);
};

COMPUTERS.forEach((computer) => {
  addImageKey(computer.id, computer.image);
  addImageKey(computer.name, computer.image);
  addImageKey(computer.name.replace(/\s*-\s*Ny$/i, " - Begagnade"), computer.image);
  if (computer.usedVariant?.productKey) {
    addImageKey(computer.usedVariant.productKey, computer.image);
  }
});

const getCanonicalImage = (product?: ProductLike | null) => {
  if (!product) return null;
  return (
    imageByKey.get(normalize(product.name)) ||
    imageByKey.get(normalize(product.slug)) ||
    imageByKey.get(normalize(product.legacy_id)) ||
    imageByKey.get(normalize(product.id)) ||
    null
  );
};

export const resolveProductImage = (product?: ProductLike | null, fallbackImage?: string | null) => {
  return (
    getCanonicalImage(product) ||
    fallbackImage ||
    product?.image_url ||
    product?.image ||
    product?.imageUrl ||
    null
  );
};
