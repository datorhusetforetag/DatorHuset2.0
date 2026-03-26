export type PreviewThemeOverride = "light" | "dark" | null;
export type PreviewAuthOverride = "logged-out" | "logged-in" | null;

const readParam = (key: string) => {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const value = params.get(key);
  return value ? value.trim().toLowerCase() : null;
};

export const getPreviewThemeOverride = (): PreviewThemeOverride => {
  const value = readParam("preview-theme");
  return value === "light" || value === "dark" ? value : null;
};

export const getPreviewAuthOverride = (): PreviewAuthOverride => {
  const value = readParam("preview-auth");
  return value === "logged-out" || value === "logged-in" ? value : null;
};
