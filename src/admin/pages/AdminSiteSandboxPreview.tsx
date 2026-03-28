import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Index from "@/pages/Index";
import Products from "@/pages/Products";
import ServiceRepair from "@/pages/ServiceRepair";
import CustomerService from "@/pages/CustomerService";
import Faq from "@/pages/Faq";
import About from "@/pages/About";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import { DEFAULT_SITE_SETTINGS, normalizeSiteSettings, type SiteSettings } from "@/lib/siteSettings";
import { SiteSettingsProvider } from "@/hooks/useSiteSettings";

const PREVIEW_STORAGE_KEY = "datorhuset_site_sandbox_preview_settings";

const readPreviewSettings = (): SiteSettings => {
  if (typeof window === "undefined") return DEFAULT_SITE_SETTINGS;
  try {
    const raw = window.sessionStorage.getItem(PREVIEW_STORAGE_KEY);
    return raw ? normalizeSiteSettings(JSON.parse(raw)) : DEFAULT_SITE_SETTINGS;
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
};

export default function AdminSiteSandboxPreview() {
  const [searchParams] = useSearchParams();
  const [settings, setSettings] = useState<SiteSettings>(() => readPreviewSettings());
  const pageKey = searchParams.get("page") || "home";

  useEffect(() => {
    const sync = (nextValue?: unknown) => {
      const nextSettings = nextValue ? normalizeSiteSettings(nextValue) : readPreviewSettings();
      setSettings(nextSettings);
      window.parent.postMessage({ type: "site-sandbox:preview-rendered" }, window.location.origin);
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "site-sandbox:update-preview-settings") {
        sync(event.data.settings);
      }
      if (event.data?.type === "site-sandbox:request-preview-sync") {
        sync();
      }
    };

    window.addEventListener("message", handleMessage);
    window.parent.postMessage({ type: "site-sandbox:preview-ready" }, window.location.origin);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  useEffect(() => {
    window.parent.postMessage({ type: "site-sandbox:preview-rendered" }, window.location.origin);
  }, [pageKey, settings]);

  const content = useMemo(() => {
    if (pageKey.startsWith("products")) return <Products />;
    if (pageKey === "service-repair") return <ServiceRepair />;
    if (pageKey === "customer-service") return <CustomerService />;
    if (pageKey === "faq") return <Faq />;
    if (pageKey === "about") return <About />;
    if (pageKey === "privacy-policy") return <PrivacyPolicy />;
    if (pageKey === "terms-of-service") return <TermsOfService />;
    return <Index />;
  }, [pageKey]);

  return (
    <SiteSettingsProvider settings={settings} mode="draft">
      <div data-site-sandbox-preview-root="true" className="min-h-screen bg-transparent">
        {content}
      </div>
    </SiteSettingsProvider>
  );
}
