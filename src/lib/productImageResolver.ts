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
  "/products/newpc/chieftecvisio-1.jpg": "/products/newpc/chieftecvisio_new.png",
  "/products/newpc/chieftecvisio-2.webp": "/products/newpc/chieftecvisio_new2.png",
  "/products/newpc/chieftecvisio-3.jpg": "/products/newpc/chieftecvisio_new2.png",
  "/products/newpc/chieftecvista-1.jpg": "/products/newpc/chieftecvisio_new.png",
  "/products/newpc/chieftecvista-2.avif": "/products/newpc/chieftecvisio_new2.png",
  "/chieftecvisio-1.jpg": "/products/newpc/chieftecvisio_new.png",
  "/chieftecvisio-2.webp": "/products/newpc/chieftecvisio_new2.png",
  "/chieftecvisio-3.jpg": "/products/newpc/chieftecvisio_new2.png",
  "/chieftecvista-1.jpg": "/products/newpc/chieftecvisio_new.png",
  "/chieftecvista-2.avif": "/products/newpc/chieftecvisio_new2.png",
};

const LEGACY_BLOCKED_IMAGE_BASENAMES = new Set([
  "chieftecvisio-1.jpg",
  "chieftecvisio-2.webp",
  "chieftecvisio-3.jpg",
  "chieftecvista-1.jpg",
  "chieftecvista-2.avif",
  "horizon3_elite_front_2000x.webp",
  "horizon3_elite_hero_2000x.webp",
  "horizon3_elite_side_2000x.webp",
  "horizon_pro_front_welitecomponents_2000x.webp",
  "horizon_pro_hero_welitecomponents_2000x.webp",
  "horizon_pro_side_welitecomponents_2000x.webp",
  "navbase_front_colorswap_2000x.webp",
  "navbase_hero_colorswap_2000x.webp",
  "navbase_side_colorswap_2000x.webp",
  "navpro_front_colorswap_2000x.webp",
  "navpro_hero_colorswap_2000x.webp",
  "navpro_side_colorswap_2000x.webp",
  "traveler_back_2000x.webp",
  "traveler_front_1_2000x.webp",
  "traveler_hero_1_2000x.webp",
  "traveler_side_1_2000x.webp",
  "traveler_top_2000x.webp",
  "voy_red_front_2000x.webp",
  "voy_red_hero_2000x.webp",
  "voy_red_side_2000x.webp",
  "voyelite_hero_new_2000x.webp",
  "voyelite_side_new_2000x.webp",
  "voyager_front_nogeforce_2000x.webp",
  "voyager_front_nogeforce_2000x_2.webp",
  "voyager_hero_nogeforce_2000x.webp",
  "voyager_hero_nogeforce_2000x_2.webp",
  "voyager_side_nogeforce_2000x.webp",
  "voyager_side_nogeforce_2000x_2.webp",
]);

const LEGACY_BLOCKED_IMAGE_TOKENS = [
  "placeholder",
  "horizon3_",
  "horizon_pro_",
  "navbase_",
  "navpro_",
  "traveler_",
  "voyager_",
  "voy_red_",
  "voyelite_",
];

const normalizeImagePathKey = (value: string) => {
  const normalized = value.trim().replace(/\\/g, "/").toLowerCase();
  if (!normalized) return "";
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
};

const getImageBasename = (value: string) => {
  const clean = value.split("?")[0].split("#")[0];
  const parts = clean.split("/");
  return (parts[parts.length - 1] || "").toLowerCase();
};

export const isLegacyBlockedProductImagePath = (value?: string | null) => {
  if (!value) return false;
  const normalized = normalizeImagePathKey(value);
  if (!normalized) return false;
  const basename = getImageBasename(normalized);
  if (LEGACY_BLOCKED_IMAGE_BASENAMES.has(basename)) return true;
  return LEGACY_BLOCKED_IMAGE_TOKENS.some((token) => normalized.includes(token));
};

export const normalizeProductImagePath = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim().replace(/\\/g, "/");
  if (!trimmed) return null;
  const lookupKey = normalizeImagePathKey(trimmed);
  const mapped = LEGACY_IMAGE_PATH_MAP[lookupKey] || trimmed;
  const absolute = /^https?:\/\//i.test(mapped) ? mapped : mapped.startsWith("/") ? mapped : `/${mapped}`;
  if (isLegacyBlockedProductImagePath(absolute)) return null;
  return /^https?:\/\//i.test(absolute) || absolute.startsWith("/") ? absolute : null;
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
  const normalizedImage = normalizeProductImagePath(image);
  if (!normalizedImage) return;
  imageByKey.set(normalized, normalizedImage);
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
    normalizedImageUrl ||
    normalizedImage ||
    normalizedImageAlt ||
    canonical ||
    normalizedFallback ||
    null
  );
};
