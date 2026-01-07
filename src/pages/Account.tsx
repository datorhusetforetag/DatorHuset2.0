import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import {
  createUserAddress,
  deleteUserAddress,
  getUserAddresses,
  setDefaultAddress,
} from "@/lib/supabaseServices";
import { KeyRound, MapPin, Package, User } from "lucide-react";

const swedishPhoneRegex = /^(?:\+46|0)7\d{8}$/;
const swedishPostalRegex = /^\d{3}\s?\d{2}$/;
const swedishCityRegex = /^[A-Za-z\u00c5\u00c4\u00d6\u00e5\u00e4\u00f6.\s-]+$/;

type OrderItem = {
  id: string;
  quantity: number;
  product?: {
    name?: string;
    price_cents?: number;
    image_url?: string | null;
  };
};

type Order = {
  id: string;
  order_number?: string | number | null;
  created_at?: string;
  total_cents?: number;
  status?: string;
  order_items?: OrderItem[];
  receipt_url?: string;
};

type Address = {
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

export default function Account() {
  const { user } = useAuth();
  const [resetStatus, setResetStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    username: "",
    phone: "",
  });
  const [profileFormErrors, setProfileFormErrors] = useState<Record<string, string>>({});
  const [profileStatus, setProfileStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [addressSuccess, setAddressSuccess] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    label: "",
    full_name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    postal_code: "",
    city: "",
    is_default: false,
  });
  const [addressFormErrors, setAddressFormErrors] = useState<Record<string, string>>({});


  useEffect(() => {
    if (!user) return;
    const metadata = user.user_metadata || {};
    setProfileForm({
      full_name: metadata.full_name || "",
      username: metadata.username || "",
      phone: metadata.phone || user.phone || "",
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    const loadAddresses = async () => {
      try {
        setLoadingAddresses(true);
        setAddressError("");
        const data = await getUserAddresses(user.id);
        if (!isMounted) return;
        setAddresses(data as Address[]);
      } catch (error) {
        if (!isMounted) return;
        setAddressError("Kunde inte hÃ¤mta sparade adresser.");
      } finally {
        if (isMounted) setLoadingAddresses(false);
      }
    };
    loadAddresses();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const profileName = useMemo(() => {
    if (profileForm.full_name.trim()) return profileForm.full_name.trim();
    if (!user) return "";
    const metadata = user.user_metadata || {};
    return metadata.full_name || metadata.username || user.email?.split("@")[0] || "Kund";
  }, [profileForm.full_name, user]);

  const defaultAddress = useMemo(() => {
    return addresses.find((addr) => addr.is_default) || addresses[0] || null;
  }, [addresses]);

  const validateProfileForm = () => {
    const nextErrors: Record<string, string> = {};
    if (!profileForm.full_name.trim()) {
      nextErrors.full_name = "Ange namn.";
    }
    const normalizedPhone = profileForm.phone.replace(/\s|-/g, "");
    if (normalizedPhone && !swedishPhoneRegex.test(normalizedPhone)) {
      nextErrors.phone = "Ange ett giltigt svenskt mobilnummer.";
    }
    setProfileFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleProfileSave = async () => {
    if (!user) return;
    if (!validateProfileForm()) return;
    setProfileStatus("saving");
    const normalizedPhone = profileForm.phone.replace(/\s|-/g, "");
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: profileForm.full_name.trim(),
          username: profileForm.username.trim() || null,
          phone: normalizedPhone || null,
        },
      });
      if (error) {
        setProfileStatus("error");
        return;
      }
      setProfileStatus("saved");
      setTimeout(() => setProfileStatus("idle"), 4000);
    } catch (error) {
      setProfileStatus("error");
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    try {
      setResetStatus("sending");
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        setResetStatus("error");
        return;
      }
      setResetStatus("sent");
    } catch (error) {
      setResetStatus("error");
    }
  };

  const validateAddressForm = () => {
    const nextErrors: Record<string, string> = {};
    if (!addressForm.full_name.trim()) {
      nextErrors.full_name = "Ange namn.";
    }
    const normalizedPhone = addressForm.phone.replace(/\s|-/g, "");
    if (normalizedPhone && !swedishPhoneRegex.test(normalizedPhone)) {
      nextErrors.phone = "Ange ett giltigt svenskt mobilnummer.";
    }
    if (!addressForm.address_line1.trim()) {
      nextErrors.address_line1 = "Ange adress.";
    }
    if (!swedishPostalRegex.test(addressForm.postal_code.trim())) {
      nextErrors.postal_code = "Ange ett giltigt postnummer.";
    }
    if (!swedishCityRegex.test(addressForm.city.trim())) {
      nextErrors.city = "Ange en giltig postort.";
    }
    setAddressFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleAddressSave = async () => {
    if (!user) return;
    if (!validateAddressForm()) return;
    const normalizedPhone = addressForm.phone.replace(/\s|-/g, "");
    try {
      setSavingAddress(true);
      setAddressError("");
      setAddressSuccess("");
      const saved = await createUserAddress({
        user_id: user.id,
        label: addressForm.label || null,
        full_name: addressForm.full_name,
        phone: normalizedPhone || null,
        address_line1: addressForm.address_line1,
        address_line2: addressForm.address_line2 || null,
        postal_code: addressForm.postal_code,
        city: addressForm.city,
        country: "SE",
        is_default: addressForm.is_default,
      });
      if (addressForm.is_default) {
        await setDefaultAddress(user.id, saved.id);
      }
      const refreshed = await getUserAddresses(user.id);
      setAddresses(refreshed as Address[]);
      setAddressForm({
        label: "",
        full_name: "",
        phone: "",
        address_line1: "",
        address_line2: "",
        postal_code: "",
        city: "",
        is_default: false,
      });
      setAddressFormErrors({});
      setAddressSuccess("Adress sparad.");
    } catch (error) {
      setAddressError(error instanceof Error ? error.message : "Kunde inte spara adressen.");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    if (!user) return;
    try {
      await setDefaultAddress(user.id, addressId);
      const refreshed = await getUserAddresses(user.id);
      setAddresses(refreshed as Address[]);
    } catch (error) {
      setAddressError("Kunde inte uppdatera standardadress.");
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!user) return;
    try {
      await deleteUserAddress(addressId);
      const refreshed = await getUserAddresses(user.id);
      setAddresses(refreshed as Address[]);
    } catch (error) {
      setAddressError("Kunde inte ta bort adressen.");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white text-gray-900 dark:bg-[#0f1824] dark:text-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1 pt-16 sm:pt-24 container mx-auto px-4 py-12">
          <div className="max-w-xl mx-auto text-center space-y-4">
            <h1 className="text-3xl font-bold">Logga in fÃ¶r att se ditt konto</h1>
            <p className="text-gray-600 dark:text-gray-300">
              For att hantera dina uppgifter och bestallningar behover du vara inloggad.
            </p>
            <Link
              to="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-yellow-400 text-gray-900 font-semibold rounded hover:bg-[#11667b] hover:text-white transition-colors"
            >
              Tillbaka till startsidan
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-[#0f1824] dark:text-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16 sm:pt-24 container mx-auto px-4 py-12">
        <div className="flex flex-col gap-3 mb-8">
          <p className="text-sm uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Mitt konto</p>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Hej {profileName}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                Hantera uppgifter, adresser och dina bestallningar.
              </p>
            </div>
            <Link
              to="/orders"
              className="inline-flex items-center justify-center px-5 py-2 rounded-lg border border-yellow-400 text-yellow-700 dark:text-yellow-300 font-semibold hover:bg-[#11667b] hover:text-white hover:border-[#11667b] transition-colors"
            >
              Mina bestallningar
            </Link>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_1.4fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
              <div className="flex items-center gap-3 mb-4">
                <User className="w-5 h-5 text-[#11667b]" />
                <h2 className="text-xl font-semibold">Mina uppgifter</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs text-gray-600 dark:text-gray-300">
                  Fullständigt namn
                  <input
                    type="text"
                    value={profileForm.full_name}
                    onChange={(event) =>
                      setProfileForm((prev) => ({ ...prev, full_name: event.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0f1824] px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-xs text-gray-600 dark:text-gray-300">
                  Användarnamn
                  <input
                    type="text"
                    value={profileForm.username}
                    onChange={(event) =>
                      setProfileForm((prev) => ({ ...prev, username: event.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0f1824] px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-xs text-gray-600 dark:text-gray-300">
                  Telefonnummer
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(event) =>
                      setProfileForm((prev) => ({ ...prev, phone: event.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0f1824] px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-xs text-gray-600 dark:text-gray-300">
                  E-post
                  <input
                    type="email"
                    value={user.email || ""}
                    disabled
                    className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-[#101a27] px-3 py-2 text-sm text-gray-500 dark:text-gray-400"
                  />
                </label>
              </div>
              {profileFormErrors.full_name && (
                <p className="text-xs text-red-500 mt-3">{profileFormErrors.full_name}</p>
              )}
              {profileFormErrors.phone && (
                <p className="text-xs text-red-500 mt-2">{profileFormErrors.phone}</p>
              )}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleProfileSave}
                  disabled={profileStatus === "saving"}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-yellow-400 text-gray-900 font-semibold hover:bg-[#11667b] hover:text-white disabled:opacity-60 transition-colors"
                >
                  {profileStatus === "saving" ? "Sparar..." : "Uppdatera information"}
                </button>
                {profileStatus === "saved" && (
                  <span className="text-xs text-green-600">Informationen är uppdaterad.</span>
                )}
                {profileStatus === "error" && (
                  <span className="text-xs text-red-500">Kunde inte uppdatera just nu.</span>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
              <div className="flex items-center gap-3 mb-4">
                <KeyRound className="w-5 h-5 text-[#11667b]" />
                <h2 className="text-xl font-semibold">Lösenord</h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                För att byta lösenord skickar vi en säker länk till din e-post.
              </p>
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={resetStatus === "sending"}
                className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-lg border border-yellow-400 text-gray-900 font-semibold bg-yellow-400 hover:bg-[#11667b] hover:text-white disabled:opacity-60 transition-colors"
              >
                {resetStatus === "sending" ? "Skickar..." : "Skicka lösenordslänk"}
              </button>
              {resetStatus === "sent" && (
                <p className="text-sm text-green-600 mt-3">
                  En verifieringslänk har skickats till {user.email}.
                </p>
              )}
              {resetStatus === "error" && (
                <p className="text-sm text-red-500 mt-3">
                  Kunde inte skicka länken just nu. Försök igen senare.
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                Tips: Kontrollera skräppost om du inte ser mejlet direkt.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
              <div className="flex items-center gap-3 mb-3">
                <Package className="w-5 h-5 text-[#11667b]" />
                <h2 className="text-xl font-semibold">Mina beställningar</h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Folj status, kvitton och leveransinfo for dina bestallningar.
              </p>
              <Link
                to="/orders"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#11667b] hover:text-[#0d4d5d]"
              >
                Öppna orderöversikt
              </Link>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-5 h-5 text-[#11667b]" />
                <div>
                  <h2 className="text-xl font-semibold">Sparade adresser</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Hanterar leverans- och fakturaadresser.</p>
                </div>
              </div>

              {defaultAddress ? (
                <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 text-sm text-gray-600 dark:text-gray-300">
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500">Standardadress</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mt-2">
                    {defaultAddress.full_name || profileName}
                  </p>
                  <p>{defaultAddress.address_line1}</p>
                  {defaultAddress.address_line2 && <p>{defaultAddress.address_line2}</p>}
                  <p>{defaultAddress.postal_code} {defaultAddress.city}</p>
                  <p>{defaultAddress.country || "SE"}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-300">Ingen adress sparad ännu.</p>
              )}

              <div className="mt-5">
                {loadingAddresses && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">Hämtar adresser...</p>
                )}
                {addressError && <p className="text-sm text-red-500">{addressError}</p>}
                {addressSuccess && <p className="text-sm text-green-600">{addressSuccess}</p>}
                {!loadingAddresses && addresses.length === 0 && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">Du har inte lagt till någon adress ännu.</p>
                )}
                <div className="space-y-3 mt-3">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {address.label || address.address_line1}
                        </p>
                        {address.is_default && (
                          <span className="text-xs rounded-full bg-yellow-100 text-yellow-800 px-2 py-1">Standard</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{address.full_name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {address.address_line1}{address.address_line2 ? `, ${address.address_line2}` : ""}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{address.postal_code} {address.city}</p>
                      <div className="flex flex-wrap gap-3 text-sm font-semibold text-[#11667b]">
                        {!address.is_default && (
                          <button type="button" onClick={() => handleSetDefault(address.id)}>
                            Sätt som standard
                          </button>
                        )}
                        <button type="button" onClick={() => handleDeleteAddress(address.id)}>
                          Ta bort
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <form
                className="mt-6 border-t border-gray-200 dark:border-gray-800 pt-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleAddressSave();
                }}
              >
                <h3 className="text-lg font-semibold mb-4">Lägg till ny adress</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Adressnamn (t.ex. Hemma)"
                    value={addressForm.label}
                    onChange={(event) => setAddressForm((prev) => ({ ...prev, label: event.target.value }))}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0f1824] px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="För- och efternamn"
                    value={addressForm.full_name}
                    onChange={(event) => setAddressForm((prev) => ({ ...prev, full_name: event.target.value }))}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0f1824] px-3 py-2 text-sm"
                  />
                  {addressFormErrors.full_name && (
                    <p className="text-xs text-red-500 md:col-span-2">{addressFormErrors.full_name}</p>
                  )}

                  <input
                    type="tel"
                    placeholder="Mobilnummer (valfritt)"
                    value={addressForm.phone}
                    onChange={(event) => setAddressForm((prev) => ({ ...prev, phone: event.target.value }))}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0f1824] px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Adress"
                    value={addressForm.address_line1}
                    onChange={(event) => setAddressForm((prev) => ({ ...prev, address_line1: event.target.value }))}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0f1824] px-3 py-2 text-sm"
                  />
                  {addressFormErrors.phone && (
                    <p className="text-xs text-red-500 md:col-span-2">{addressFormErrors.phone}</p>
                  )}
                  {addressFormErrors.address_line1 && (
                    <p className="text-xs text-red-500 md:col-span-2">{addressFormErrors.address_line1}</p>
                  )}

                  <input
                    type="text"
                    placeholder="Adressrad 2 (valfritt)"
                    value={addressForm.address_line2}
                    onChange={(event) => setAddressForm((prev) => ({ ...prev, address_line2: event.target.value }))}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0f1824] px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Postnummer"
                    value={addressForm.postal_code}
                    onChange={(event) => setAddressForm((prev) => ({ ...prev, postal_code: event.target.value }))}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0f1824] px-3 py-2 text-sm"
                  />
                  {addressFormErrors.postal_code && (
                    <p className="text-xs text-red-500 md:col-span-2">{addressFormErrors.postal_code}</p>
                  )}

                  <input
                    type="text"
                    placeholder="Postort"
                    value={addressForm.city}
                    onChange={(event) => setAddressForm((prev) => ({ ...prev, city: event.target.value }))}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0f1824] px-3 py-2 text-sm"
                  />
                  {addressFormErrors.city && (
                    <p className="text-xs text-red-500 md:col-span-2">{addressFormErrors.city}</p>
                  )}
                </div>
                <label className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={addressForm.is_default}
                    onChange={(event) => setAddressForm((prev) => ({ ...prev, is_default: event.target.checked }))}
                    className="w-4 h-4 text-yellow-400"
                  />
                  Sätt som standardadress
                </label>
                <button
                  type="submit"
                  disabled={savingAddress}
                  className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-yellow-400 text-gray-900 font-semibold hover:bg-[#11667b] hover:text-white disabled:opacity-60 transition-colors"
                >
                  {savingAddress ? "Sparar..." : "Spara adress"}
                </button>
              </form>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Package className="w-5 h-5 text-[#11667b]" />
                <h2 className="text-xl font-semibold">Orderhistorik</h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                Status uppdateras manuellt när vi bygger din dator.
              </p>

              {loadingOrders && (
                <p className="text-sm text-gray-600 dark:text-gray-300">Hämtar order...</p>
              )}
              {orderError && (
                <p className="text-sm text-red-500">{orderError}</p>
              )}
              {!loadingOrders && !orderError && orders.length === 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Du har inga registrerade ordrar ännu.
                </p>
              )}

              <div className="space-y-6">
                {orders.map((order) => {
                  const statusInfo = getOrderStatusInfo(order.status);
                  const stage = statusInfo.step;
                  const orderDate = order.created_at
                    ? new Date(order.created_at).toLocaleDateString("sv-SE")
                    : "Okänt datum";
                  const total = typeof order.total_cents === "number" ? order.total_cents / 100 : 0;
                  const items = order.order_items || [];
                  const firstItem = items[0];
                  const itemName = firstItem?.product?.name || "Produkt";
                  const itemCount = items.length;
                  const itemLabel = itemCount > 1 ? `${itemName} + ${itemCount - 1} fler` : itemName;
                  const itemImage = firstItem?.product?.image_url || "";
                  const orderNumber = order.order_number ? String(order.order_number) : order.id.slice(0, 8);

                  return (
                    <div
                      key={order.id}
                      className="relative overflow-hidden rounded-2xl border border-[#1a2636] bg-gradient-to-br from-[#0b1320] to-[#0f1a2a] p-5 sm:p-6 shadow-lg"
                    >
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#11667b] via-yellow-400 to-[#11667b]" />
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="h-16 w-20 sm:h-20 sm:w-28 rounded-xl border border-[#22324a] bg-[#0f1824] overflow-hidden flex items-center justify-center text-xs text-slate-400">
                              {itemImage ? (
                                <img
                                  src={itemImage}
                                  alt={itemName}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <span>Ingen bild</span>
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-slate-300">
                                Order {orderNumber} · <span className="font-semibold text-white">{itemLabel}</span>
                              </p>
                              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Beställd: {orderDate}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex items-center rounded-full border border-yellow-400/60 bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-200">
                              {statusInfo.label}
                            </span>
                            <p className="mt-2 text-sm text-slate-400">Totalt</p>
                            <p className="text-lg font-semibold text-white">{total.toLocaleString("sv-SE")} kr</p>
                          </div>
                        </div>

                        <div className="w-full rounded-xl border border-[#1f2b3f] bg-[#0b1320]/60 p-3 sm:p-4">
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-xs font-semibold text-slate-300">
                            {ORDER_STATUS_STEPS.map((label, index) => (
                              <div
                                key={label}
                                className={`rounded-full px-3 py-1 text-center border ${
                                  stage >= index + 1
                                    ? "border-yellow-400 bg-yellow-400/20 text-yellow-100"
                                    : "border-[#283448] text-slate-400"
                                }`}
                              >
                                {label}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-300">
                          <span>
                            Status: <span className="font-semibold text-white">{statusInfo.label}</span>
                          </span>
                          <span>
                            ETA: <span className="font-semibold text-white">{statusInfo.eta}</span>
                          </span>
                          {order.receipt_url ? (
                            <a
                              href={order.receipt_url}
                              className="font-semibold text-[#9dd4e0] hover:text-white"
                            >
                              Kvitto
                            </a>
                          ) : (
                            <span>Kvitto skickas via e-post</span>
                          )}
                        </div>

                        {stage === 5 && (
                          <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 text-yellow-100 px-4 py-3 text-sm">
                            DatorHuset ringer dig om när och var du kan hämta upp datorn. Vi ringer och skickar mejl.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}




