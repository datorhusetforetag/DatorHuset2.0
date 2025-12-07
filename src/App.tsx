import { Toaster } from "@/components/ui/toaster";
// import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index.tsx";
import Products from "./pages/Products.tsx";
import ComputerDetails from "./pages/ComputerDetails.tsx";
import SearchResults from "./pages/SearchResults.tsx";
import Cart from "./pages/Cart.tsx";
import Checkout from "./pages/Checkout.tsx";
import CheckoutSuccess from "./pages/CheckoutSuccess.tsx";
import Account from "./pages/Account.tsx";
import Orders from "./pages/Orders.tsx";
import Faq from "./pages/Faq.tsx";
import CustomerService from "./pages/CustomerService.tsx";
import CustomBuild from "./pages/CustomBuild.tsx";
import ServiceRepair from "./pages/ServiceRepair.tsx";
import About from "./pages/About.tsx";
import NotFound from "./pages/NotFound.tsx";
import { ScrollToTop } from "./components/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      {/* <Sonner /> */}
      <BrowserRouter>
        <ScrollToTop>
          <Routes>
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ScrollToTop>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
