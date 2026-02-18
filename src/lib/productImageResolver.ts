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

const LEGACY_IMAGE_PATH_MAP: Record<string, string> = {
  "/products/newpc/cg530-1.jpg": "/products/newpc/cg530_new2.jpg",
  "/products/newpc/cg530-2.jpg": "/products/newpc/cg530_new3.jpg",
  "/products/newpc/cg530-3.jpg": "/products/newpc/cg530_new4.jpg",
};

export const normalizeProductImagePath = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  return LEGACY_IMAGE_PATH_MAP[trimmed] || trimmed;
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
  imageByKey.set(normalized, normalizeProductImagePath(image) || image);
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
  const canonical = getCanonicalImage(product);
  const normalizedFallback = normalizeProductImagePath(fallbackImage);
  const normalizedImageUrl = normalizeProductImagePath(product?.image_url);
  const normalizedImage = normalizeProductImagePath(product?.image);
  const normalizedImageAlt = normalizeProductImagePath(product?.imageUrl);

  return (
    canonical ||
    normalizedFallback ||
    normalizedImageUrl ||
    normalizedImage ||
    normalizedImageAlt ||
    null
  );
};
