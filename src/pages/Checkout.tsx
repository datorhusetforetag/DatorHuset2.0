import { PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { CheckoutSteps } from "@/components/CheckoutSteps";
import { PAGE_BANNERS } from "@/lib/pageBanners";
import { LoginButton } from "@/components/LoginButton";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { getUserAddresses } from "@/lib/supabaseServices";
import { resolveProductImage } from "@/lib/productImageResolver";
import { trackEvent } from "@/lib/analytics";

const swedishPhoneRegex = /^(?:\+46|0)7\d{8}$/;
const swedishPostalRegex = /^\d{3}\s?\d{2}$/;
const swedishCityRegex = /^[A-Za-z\u00c5\u00c4\u00d6\u00e5\u00e4\u00f6.\s-]+$/;

type SavedAddress = {
  id: string;
  label?: string | null;
  full_name?: string | null;
  phone?: string | null;
  address_line1: string;
  address_line2?: string | null;
  postal_code: string;
  city: string;
  country?: string | null;
  is_default?: boolean;
};

export default function Checkout() {
  const { items, totalPrice, loading: cartLoading, unitPriceOf, describeItem } = useCart();
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [email, setEmail] = useState(user?.email || "");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [doorCode, setDoorCode] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [acceptedPrivacyPolicy, setAcceptedPrivacyPolicy] = useState(false);
  const [acceptedTermsOfService, setAcceptedTermsOfService] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<"pickup" | "postnord">("pickup");
  const [errors, setErrors] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    postalCode: "",
    city: "",
  });
  const fullName = `${firstName} ${lastName}`.trim();
  const requiresShipping = shippingMethod === "postnord";
  const shippingCostCents = requiresShipping ? 31500 : 0;
  const totalWithFees = totalPrice + shippingCostCents;

  useEffect(() => {
    void trackEvent({
      event: "checkout_viewed",
      properties: {
        itemCount: items.length,
        authenticated: Boolean(user),
        totalCents: totalWithFees,
      },
    });
  }, [items.length, totalWithFees, user]);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    const loadAddresses = async () => {
      try {
        setLoadingAddresses(true);
        const data = await getUserAddresses(user.id);
        if (!isMounted) return;
        setAddresses(data as SavedAddress[]);
        const defaultAddress = (data as SavedAddress[]).find((item) => item.is_default) || data?.[0];
        if (defaultAddress) {
          applyAddress(defaultAddress);
          setSelectedAddressId(defaultAddress.id);
        }
      } catch (error) {
        console.error("Failed to load addresses", error);
      } finally {
        if (isMounted) setLoadingAddresses(false);
      }
    };
    loadAddresses();
    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user?.email) return;
    setEmail((prev) => (prev.trim() ? prev : user.email || ""));
  }, [user?.email]);

  const applyAddress = (saved: SavedAddress) => {
    if (!saved) return;
    const parts = (saved.full_name || "").trim().split(" ").filter(Boolean);
    const first = parts.shift() || "";
    const last = parts.join(" ");
    setFirstName(first);
    setLastName(last);
    setPhone(saved.phone || "");
    setAddress([saved.address_line1, saved.address_line2].filter(Boolean).join(", "));
    setPostalCode(saved.postal_code || "");
    setCity(saved.city || "");
  };

  if (cartLoading) {
    return (
      <PageShell>
      <PageHero
        compact
        accent={PAGE_BANNERS.checkout.accent}
        sandboxId="checkout-hero"
        breadcrumb={[{ label: "Hem", href: "/" }, { label: "Kundvagn", href: "/cart" }, { label: "Kassa" }]}
        eyebrow="Kassa"
        title="Kassa"
      />
        <div className="container mx-auto px-4 py-20">
          <p className="text-muted-foreground">Laddar kundvagn...</p>
        </div>
      </PageShell>
    );
  }

  if (items.length === 0) {
    return (
      <PageShell>
      <PageHero
        compact
        accent={PAGE_BANNERS.checkout.accent}
        sandboxId="checkout-hero"
        breadcrumb={[{ label: "Hem", href: "/" }, { label: "Kundvagn", href: "/cart" }, { label: "Kassa" }]}
        eyebrow="Kassa"
        title="Din kundvagn är tom"
        lede="Det finns inget att gå till kassan med. Lägg till en dator först."
        actions={
          <button type="button" onClick={() => navigate("/products")} className="btn-primary">
            Fortsätt handla
          </button>
        }
      />
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell>
      <PageHero
        compact
        accent={PAGE_BANNERS.checkout.accent}
        sandboxId="checkout-hero"
        breadcrumb={[{ label: "Hem", href: "/" }, { label: "Kundvagn", href: "/cart" }, { label: "Kassa" }]}
        eyebrow="Kassa"
        title="Kassa"
        actions={<CheckoutSteps current={2} accent={PAGE_BANNERS.checkout.accent} />}
      />
        <div className="pt-10">
          <div className="container mx-auto px-4 pb-24">

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-foreground/[0.04] p-6 rounded-lg border border-foreground/10">
                  <div className="rounded-lg border border-primary/60 bg-primary/10 p-5 dark:border-primary/40 dark:bg-background/70">
                    <h2 className="text-xl font-bold text-foreground mb-2">Logga in för att slutföra köpet</h2>
                    <p className="text-sm text-foreground mb-4">
                      Du kan lägga produkter i kundvagnen utan konto. För att gå vidare till betalning behöver du logga in.
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <LoginButton />
                      <button
                        onClick={() => navigate('/cart')}
                        className="px-4 py-2 border border-foreground/20 text-foreground font-semibold rounded hover:bg-foreground/[0.06] transition-colors"
                      >
                        Tillbaka till kundvagn
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="bg-foreground/[0.04] p-6 rounded-lg border border-foreground/10 lg:sticky lg:top-24">
                  <h2 className="text-xl font-bold text-foreground mb-6">Ordersammanfattning</h2>

                  <div className="space-y-3 mb-6 pb-6 border-b border-foreground/10">
                    {items.map((item) => {
                      const imageSrc = resolveProductImage(item.product);
                      return (
                        <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                          <div className="flex min-w-0 items-center gap-3">
                            {imageSrc ? (
                              <img
                                src={imageSrc}
                                alt={item.product?.name || "Produkt"}
                                className="h-12 w-12 rounded object-cover border border-foreground/10"
                                loading="lazy"
                                decoding="async"
                              />
                            ) : null}
                            <span className="text-muted-foreground dark:text-foreground truncate">
                              {item.product?.name}{describeItem(item) ? ` · ${describeItem(item)}` : ""} x{item.quantity}
                            </span>
                          </div>
                          <span className="font-semibold text-foreground">
                            {((unitPriceOf(item) * item.quantity) / 100).toLocaleString("sv-SE")} kr
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-3 mb-6 pb-6 border-b border-foreground/10">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground dark:text-foreground">Delsumma:</span>
                      <span className="font-semibold text-foreground">{totalPrice / 100} kr</span>
                    </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground dark:text-foreground">Frakt:</span>
                    <span className="font-semibold text-foreground">
                      {requiresShipping ? "315 kr" : "Ingen frakt vald"}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-lg font-bold text-foreground">Totalt:</span>
                  <span className="text-2xl font-bold text-foreground">{totalWithFees / 100} kr</span>
                </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </PageShell>
    );
  }

  const validateFields = () => {
    const normalizedPhone = phone.replace(/\s+/g, "");
    const nextErrors = {
      email: email.trim() ? "" : "Ange en giltig e-postadress.",
      firstName: firstName.trim().length >= 2 ? "" : "Ange förnamn.",
      lastName: lastName.trim().length >= 2 ? "" : "Ange efternamn.",
      phone: swedishPhoneRegex.test(normalizedPhone) ? "" : "Ange ett giltigt svenskt mobilnummer.",
      address: requiresShipping ? (address.trim().length >= 5 ? "" : "Ange en giltig adress.") : "",
      postalCode: requiresShipping
        ? swedishPostalRegex.test(postalCode.trim())
          ? ""
          : "Ange ett giltigt postnummer."
        : "",
      city: requiresShipping
        ? swedishCityRegex.test(city.trim())
          ? ""
          : "Ange en giltig postort."
        : "",
    };

      setErrors(nextErrors);
    return Object.values(nextErrors).every((value) => value === "");
  };

  const handleCheckout = async () => {
    void trackEvent({
      event: "checkout_started",
      properties: {
        itemCount: items.length,
        totalCents: totalWithFees,
        shippingMethod,
      },
    });

    if (!validateFields()) {
      alert("Kontrollera att alla fält är korrekt ifyllda.");
      return;
    }
    if (!acceptedPrivacyPolicy || !acceptedTermsOfService) {
      alert("Du måste godkänna Integritetspolicy och Allmänna villkor innan betalning.");
      return;
    }

    try {
      setLoading(true);

      // Call backend to create Stripe Checkout Session
      // Call same-origin API to avoid CORS issues
      const authHeader = session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {};
      const response = await fetch(`/api/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({
          cartItems: items.map((item) => ({
            productId: item.product_id,
            productName: item.product?.name,
            unitPriceCents: unitPriceOf(item),
            quantity: item.quantity,
          })),
          userEmail: email,
          fullName: fullName,
          phone,
          address,
          postalCode,
          city,
          deliveryInstructions,
          doorCode,
          deliveryTime,
          addressId: selectedAddressId,
          totalCents: totalWithFees,
          shippingMethod,
        }),
      });

      const data = await response.json();

      if (data.error) {
        void trackEvent({
          event: "checkout_failed",
          properties: { reason: data.error || "unknown" },
        });
        alert(`Checkout error: ${data.error}`);
        return;
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        void trackEvent({
          event: "checkout_redirected_to_stripe",
          properties: {
            shippingMethod,
            totalCents: totalWithFees,
          },
        });
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      void trackEvent({
        event: "checkout_failed",
        properties: { reason: "network_or_server_error" },
      });
      alert("Kunde inte starta checkout");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    email.trim().length > 0 &&
    firstName.trim().length >= 2 &&
    lastName.trim().length >= 2 &&
    swedishPhoneRegex.test(phone.replace(/\s+/g, "")) &&
    (!requiresShipping ||
      (address.trim().length >= 5 &&
        swedishPostalRegex.test(postalCode.trim()) &&
        swedishCityRegex.test(city.trim()))) &&
    acceptedPrivacyPolicy &&
    acceptedTermsOfService;

  return (
    <PageShell>
      <PageHero
        compact
        accent={PAGE_BANNERS.checkout.accent}
        sandboxId="checkout-hero"
        breadcrumb={[{ label: "Hem", href: "/" }, { label: "Kundvagn", href: "/cart" }, { label: "Kassa" }]}
        eyebrow="Kassa"
        title="Kassa"
        lede="Två steg kvar. Inget dras förrän du bekräftar."
        actions={<CheckoutSteps current={2} accent={PAGE_BANNERS.checkout.accent} />}
      />
      <div className="pt-10">
        <div className="container mx-auto px-4 pb-24">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2">
              <div className="bg-foreground/[0.04] p-6 rounded-lg border border-foreground/10">
                <h2 className="text-xl font-bold text-foreground mb-6">Leveransuppgifter</h2>

                <div className="space-y-4">
                  <div className="rounded-lg border border-foreground/10 bg-background/70 dark:bg-background/70 p-4">
                    <h3 className="text-base font-semibold text-foreground">Leveranssätt</h3>
                    <p className="text-sm text-muted-foreground dark:text-foreground mt-1">Vi skickar endast inom Sverige.</p>
                    <div className="mt-4 space-y-3">
                      <label className="flex items-start gap-3 rounded-lg border border-foreground/10 p-3">
                        <input
                          type="radio"
                          name="shippingMethod"
                          value="pickup"
                          checked={shippingMethod === "pickup"}
                          onChange={() => setShippingMethod("pickup")}
                          className="mt-1"
                        />
                        <div>
                              <p className="font-semibold text-foreground">Upphämtning i Spånga (gratis)</p>
                          <p className="text-sm text-muted-foreground dark:text-foreground">
                                Hämta upp din dator i Spånga efter att bygget är klart.
                          </p>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 rounded-lg border border-foreground/10 p-3">
                        <input
                          type="radio"
                          name="shippingMethod"
                          value="postnord"
                          checked={shippingMethod === "postnord"}
                          onChange={() => setShippingMethod("postnord")}
                          className="mt-1"
                        />
                        <div>
                          <p className="font-semibold text-foreground">PostNord till ombud (315 kr)</p>
                          <p className="text-sm text-muted-foreground dark:text-foreground">
                            Spårbar frakt till ombud. Leverans 1-2 vardagar efter att bygget är klart.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {requiresShipping && addresses.length > 0 && (
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        {"Sparade adresser"}
                      </label>
                      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                        <select
                          value={selectedAddressId || ""}
                          onChange={(event) => {
                            const nextId = event.target.value || null;
                            setSelectedAddressId(nextId);
                            const selected = addresses.find((item) => item.id === nextId);
                            if (selected) applyAddress(selected);
                          }}
                          className="w-full sm:max-w-xs px-4 py-2 border rounded focus:outline-none focus:border-primary bg-background/70 text-foreground border-foreground/20"
                        >
                          <option value="">Välj adress...</option>
                          {addresses.map((saved) => (
                            <option key={saved.id} value={saved.id}>
                              {saved.label || saved.address_line1}
                              {saved.is_default ? " (Standard)" : ""}
                            </option>
                          ))}
                        </select>
                        {loadingAddresses && (
                          <span className="text-xs text-muted-foreground dark:text-muted-foreground">Hämtar adresser...</span>
                        )}
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      {"E-postadress"}
                    </label>
                    <input
                      type="email"
                      required
                      inputMode="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="exempel@example.com"
                      aria-invalid={Boolean(errors.email)}
                      className={`w-full px-4 py-2 border rounded focus:outline-none focus:border-primary bg-background/70 text-foreground placeholder:text-muted-foreground dark:placeholder:text-muted-foreground ${
                        errors.email ? "border-red-400" : "border-foreground/20"
                      }`}
                    />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Förnamn
                      </label>
                      <input
                        type="text"
                        required
                        autoComplete="given-name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Jan"
                        aria-invalid={Boolean(errors.firstName)}
                        className={`w-full px-4 py-2 border rounded focus:outline-none focus:border-primary bg-background/70 text-foreground placeholder:text-muted-foreground dark:placeholder:text-muted-foreground ${
                          errors.firstName ? "border-red-400" : "border-foreground/20"
                        }`}
                      />
                      {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        {"Efternamn"}
                      </label>
                      <input
                        type="text"
                        required
                        autoComplete="family-name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Svensson"
                        aria-invalid={Boolean(errors.lastName)}
                        className={`w-full px-4 py-2 border rounded focus:outline-none focus:border-primary bg-background/70 text-foreground placeholder:text-muted-foreground dark:placeholder:text-muted-foreground ${
                          errors.lastName ? "border-red-400" : "border-foreground/20"
                        }`}
                      />
                      {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        {"Mobil nr"}
                      </label>
                      <input
                        type="tel"
                        required
                        inputMode="tel"
                        pattern="^(?:\\+46|0)7\\d{8}$"
                        autoComplete="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="07x xxx xx xx"
                        aria-invalid={Boolean(errors.phone)}
                        className={`w-full px-4 py-2 border rounded focus:outline-none focus:border-primary bg-background/70 text-foreground placeholder:text-muted-foreground dark:placeholder:text-muted-foreground ${
                          errors.phone ? "border-red-400" : "border-foreground/20"
                        }`}
                      />
                      {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">Ex: 07x xxx xx xx</p>
                    </div>
                  </div>

                  {requiresShipping && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                          {"Adress"}
                        </label>
                        <input
                          type="text"
                          required
                          autoComplete="street-address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Gatan 1"
                          aria-invalid={Boolean(errors.address)}
                          className={`w-full px-4 py-2 border rounded focus:outline-none focus:border-primary bg-background/70 text-foreground placeholder:text-muted-foreground dark:placeholder:text-muted-foreground ${
                            errors.address ? "border-red-400" : "border-foreground/20"
                          }`}
                        />
                        {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-2">
                            {"Postnummer"}
                          </label>
                          <input
                            type="text"
                            required
                            inputMode="numeric"
                            pattern="^\\d{3}\\s?\\d{2}$"
                            autoComplete="postal-code"
                            value={postalCode}
                            onChange={(e) => setPostalCode(e.target.value)}
                            placeholder="123 45"
                            aria-invalid={Boolean(errors.postalCode)}
                            className={`w-full px-4 py-2 border rounded focus:outline-none focus:border-primary bg-background/70 text-foreground placeholder:text-muted-foreground dark:placeholder:text-muted-foreground ${
                              errors.postalCode ? "border-red-400" : "border-foreground/20"
                            }`}
                          />
                          {errors.postalCode && <p className="text-xs text-red-500 mt-1">{errors.postalCode}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-2">
                            {"Postort"}
                          </label>
                          <input
                            type="text"
                            required
                            autoComplete="address-level2"
                            pattern="^[A-Za-z\u00c5\u00c4\u00d6\u00e5\u00e4\u00f6.\\s-]+$"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="Stockholm"
                            aria-invalid={Boolean(errors.city)}
                            className={`w-full px-4 py-2 border rounded focus:outline-none focus:border-primary bg-background/70 text-foreground placeholder:text-muted-foreground dark:placeholder:text-muted-foreground ${
                              errors.city ? "border-red-400" : "border-foreground/20"
                            }`}
                          />
                          {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
                        </div>
                      </div>

                      <div className="mt-6 rounded-lg border border-foreground/10 bg-background/70 dark:bg-background/70 p-4">
                        <h3 className="text-base font-semibold text-foreground">Lägg till fraktinformation</h3>
                        <p className="text-sm text-muted-foreground dark:text-foreground mt-1">
                          Hjälp budet att leverera snabbare (portkod, önskad tid, instruktioner).
                        </p>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                              Portkod (valfritt)
                            </label>
                            <input
                              type="text"
                              value={doorCode}
                              onChange={(e) => setDoorCode(e.target.value)}
                              placeholder="1234"
                              className="w-full px-4 py-2 border rounded focus:outline-none focus:border-primary bg-background/70 text-foreground placeholder:text-muted-foreground dark:placeholder:text-muted-foreground border-foreground/20"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                              Önskad leveranstid (valfritt)
                            </label>
                            <input
                              type="text"
                              value={deliveryTime}
                              onChange={(e) => setDeliveryTime(e.target.value)}
                              placeholder="Vardagar 17-20"
                              className="w-full px-4 py-2 border rounded focus:outline-none focus:border-primary bg-background/70 text-foreground placeholder:text-muted-foreground dark:placeholder:text-muted-foreground border-foreground/20"
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          <label className="block text-sm font-semibold text-foreground mb-2">
                            Leveransinstruktioner (valfritt)
                          </label>
                          <textarea
                            value={deliveryInstructions}
                            onChange={(e) => setDeliveryInstructions(e.target.value)}
                            placeholder="Lämna vid dörren / ring vid leverans / våning osv."
                            className="w-full min-h-[96px] px-4 py-2 border rounded focus:outline-none focus:border-primary bg-background/70 text-foreground placeholder:text-muted-foreground dark:placeholder:text-muted-foreground border-foreground/20"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <div className="bg-foreground/[0.04] p-6 rounded-lg border border-foreground/10 lg:sticky lg:top-24">
                <h2 className="text-xl font-bold text-foreground mb-6">Ordersammanfattning</h2>

                <div className="space-y-3 mb-6 pb-6 border-b border-foreground/10">
                  {items.map((item) => {
                    const imageSrc = resolveProductImage(item.product);
                    return (
                      <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                        <div className="flex min-w-0 items-center gap-3">
                          {imageSrc ? (
                            <img
                              src={imageSrc}
                              alt={item.product?.name || "Produkt"}
                              className="h-12 w-12 rounded object-cover border border-foreground/10"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : null}
                          <span className="text-muted-foreground dark:text-foreground truncate">
                            {item.product?.name}{describeItem(item) ? ` · ${describeItem(item)}` : ""} x{item.quantity}
                          </span>
                        </div>
                        <span className="font-semibold text-foreground">
                          {((unitPriceOf(item) * item.quantity) / 100).toLocaleString("sv-SE")} kr
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-3 mb-6 pb-6 border-b border-foreground/10">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground dark:text-foreground">Delsumma:</span>
                    <span className="font-semibold text-foreground">{totalPrice / 100} kr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground dark:text-foreground">Frakt:</span>
                    <span className="font-semibold text-foreground">Väljs i kassan</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground dark:text-foreground">Skatt:</span>
                    <span className="font-semibold text-foreground">Inkluderad</span>
                  </div>
                </div>

                <div className="flex justify-between mb-6">
                  <span className="text-lg font-bold text-foreground">Totalt:</span>
                  <span className="text-2xl font-bold text-foreground">{totalWithFees / 100} kr</span>
                </div>

                <div className="mb-5 space-y-3 rounded-lg border border-foreground/10 bg-background/70 p-3 dark:border-foreground/20 dark:bg-background/70">
                  <label className="flex items-start gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={acceptedPrivacyPolicy}
                      onChange={(event) => setAcceptedPrivacyPolicy(event.target.checked)}
                      className="mt-1"
                    />
                    <span>
                      Jag godkänner{" "}
                      <a
                        href="/privacy-policy"
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-primary hover:underline"
                      >
                        Integritetspolicy
                      </a>
                      .
                    </span>
                  </label>
                  <label className="flex items-start gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={acceptedTermsOfService}
                      onChange={(event) => setAcceptedTermsOfService(event.target.checked)}
                      className="mt-1"
                    />
                    <span>
                      Jag godkänner{" "}
                      <a
                        href="/terms-of-service"
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-primary hover:underline"
                      >
                        Allmänna villkor
                      </a>
                      .
                    </span>
                  </label>
                  {requiresShipping && (
                    <p className="rounded-lg border border-primary/60 bg-primary/10 px-3 py-2 text-xs text-muted-foreground dark:border-primary/40 dark:bg-primary/10 dark:text-primary">
                      Vid frakt demonterar vi grafikkortet för säker transport. Du får en videoguide för montering när varan levereras. Vid frågor är du välkommen att mejla oss.
                    </p>
                  )}
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={loading || !isFormValid}
                  className="w-full px-4 py-3 bg-primary text-primary-foreground font-bold rounded hover:bg-secondary hover:text-white disabled:bg-foreground/[0.08] transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {loading ? "Bearbetar..." : "Gå till betalning"}
                </button>

                <button
                  onClick={() => navigate("/cart")}
                  className="w-full mt-3 px-4 py-3 border border-foreground/20 text-foreground font-semibold rounded hover:bg-foreground/[0.06] transition-colors"
                >
                  Tillbaka till kundvagn
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

