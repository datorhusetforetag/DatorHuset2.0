type UtmParams = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
};

const normalizeValue = (value: string) =>
  value
    .toLowerCase()
    .replace(/[åä]/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const withUtm = (href: string, params: UtmParams) => {
  try {
    const base =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "https://datorhuset.site";
    const url = new URL(href, base);
    Object.entries(params).forEach(([key, value]) => {
      if (!value) return;
      if (!url.searchParams.get(key)) {
        url.searchParams.set(key, value);
      }
    });
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return href;
  }
};

export const buildUtmContent = (value: string) => normalizeValue(value);
