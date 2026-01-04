import { Toaster } from "@/components/ui/toaster";
// import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import NotFound from "./pages/NotFound.tsx";
import { ScrollToTop } from "./components/ScrollToTop";
import { AdminLayout } from "./admin/AdminLayout";
import { AdminNotFound } from "./admin/AdminNotFound";
import AdminInventory from "./admin/pages/AdminInventory";
import AdminOrders from "./admin/pages/AdminOrders";
import AdminBuild from "./admin/pages/AdminBuild";

const Index = lazy(() => import("./pages/Index.tsx"));
const Products = lazy(() => import("./pages/Products.tsx"));
const ComputerDetails = lazy(() => import("./pages/ComputerDetails.tsx"));
const SearchResults = lazy(() => import("./pages/SearchResults.tsx"));
const Cart = lazy(() => import("./pages/Cart.tsx"));
const Checkout = lazy(() => import("./pages/Checkout.tsx"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess.tsx"));
const Account = lazy(() => import("./pages/Account.tsx"));
const Orders = lazy(() => import("./pages/Orders.tsx"));
const Faq = lazy(() => import("./pages/Faq.tsx"));
const CustomerService = lazy(() => import("./pages/CustomerService.tsx"));
const CustomBuild = lazy(() => import("./pages/CustomBuild.tsx"));
const ServiceRepair = lazy(() => import("./pages/ServiceRepair.tsx"));
const About = lazy(() => import("./pages/About.tsx"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy.tsx"));
const TermsOfService = lazy(() => import("./pages/TermsOfService.tsx"));
const queryClient = new QueryClient();
const isAdminApp = import.meta.env.VITE_APP_MODE === "admin";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      {/* <Sonner /> */}
      <BrowserRouter>
        <ScrollToTop>
          <Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center bg-white text-gray-900 dark:bg-[#0f1824] dark:text-gray-50">
                <p className="text-sm font-semibold">Laddar sida...</p>
              </div>
            }
          >
            <Routes>
              {isAdminApp ? (
                <>
                  <Route path="/" element={<AdminLayout />}>
                    <Route index element={<AdminInventory />} />
                    <Route path="lager" element={<AdminInventory />} />
                    <Route path="bestallningar" element={<AdminOrders />} />
                    <Route path="bygg" element={<AdminBuild />} />
                  </Route>
                  <Route path="*" element={<AdminNotFound />} />
                </>
              ) : (
                <>
                  <Route path="/" element={<Index />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/computer/:id" element={<ComputerDetails />} />
                  <Route path="/search" element={<SearchResults />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/checkout-success" element={<CheckoutSuccess />} />
                  <Route path="/account" element={<Account />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/faq" element={<Faq />} />
                  <Route path="/kundservice" element={<CustomerService />} />
                  <Route path="/custom-bygg" element={<CustomBuild />} />
                  <Route path="/service-reparation" element={<ServiceRepair />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms-of-service" element={<TermsOfService />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </>
              )}
            </Routes>
          </Suspense>
        </ScrollToTop>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
