// src/App.jsx
import { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";


// 🚀 LAZY LOADED PAGES - Only loaded when needed
// Pages (pubbliche)
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.jsx"));

// Pages (protette)
const Dashboard = lazy(() => import("./pages/Dashboard"));

const SagaDetail = lazy(() => import("./pages/SagaDetail.jsx"));
const SagaIntro = lazy(() => import("./pages/SagaIntro.jsx"));
const Profilo = lazy(() => import("./pages/Profilo.jsx"));
const Missioni = lazy(() => import("./pages/Missioni.jsx"));
const VoucherList = lazy(() => import("./pages/VoucherList"));
const MyOrders = lazy(() => import("./pages/MyOrders"));

// NUOVE pagine
const Shop = lazy(() => import("./pages/Shop"));
const MarketItemDetail = lazy(() => import("./pages/MarketItemDetail"));
const MarketPurchaseSuccess = lazy(() => import("./pages/MarketPurchaseSuccess"));
const Partner = lazy(() => import("./pages/Partner.jsx"));
const PartnerDetail = lazy(() => import("./pages/PartnerDetail.jsx"));
const PartnerJoin = lazy(() => import("./pages/PartnerJoin.jsx"));
const PartnerDashboard = lazy(() => import("./pages/PartnerDashboard.jsx"));
const PinPad = lazy(() => import("./pages/PinPad.jsx"));


// Mappa (lazy loaded)
const Mappa = lazy(() => import("./pages/Mappa"));


// Onboarding interessi
const OnboardingInteressi = lazy(() => import("./pages/OnboardingInteressi"));

// Chat


// NUOVE PAGINE PROFILO
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy.jsx"));
const TerminiCondizioni = lazy(() => import("./pages/TerminiCondizioni.jsx"));



// ⭐️ PAGINA PREMI MENSILI


// Admin
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));

const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminPartners = lazy(() => import("./pages/admin/AdminPartners"));
// (AdminOffers removed)
const AdminTransazioni = lazy(() => import("./pages/admin/AdminTransazioni.jsx"));
const AdminCards = lazy(() => import("./pages/admin/AdminCards.jsx"));


// ⭐️ NEW ALBUM PAGE
const Album = lazy(() => import("./pages/Album"));


// ⭐️ EVENTI CLUB
const Eventi = lazy(() => import("./pages/Eventi"));
const EventDetail = lazy(() => import("./pages/EventDetail"));

// 🗺️ LOCAL CONCIERGE
const DailyPlans = lazy(() => import("./pages/DailyPlans"));
const PlanDetail = lazy(() => import("./pages/PlanDetail"));
const VibeRadar = lazy(() => import("./pages/VibeRadar"));


// Layout - Keep layout eager for better UX
import Layout from "./components/Layout";

// 📲 PWA install banner - Keep eager as it's small and important


// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-warm-white">
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-olive-dark mx-auto" />
      <p className="text-olive-light text-sm">Caricamento...</p>
    </div>
  </div>
);

// ---------- PROTECTED ROUTE ----------
const ProtectedRoute = ({ children }) => {
  const { user, loading, profile } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-olive-dark" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Gate onboarding
  const requiresOnboarding =
    profile && profile.has_onboarding_completed === false;
  const isOnboardingRoute = location.pathname === "/onboarding";

  if (requiresOnboarding && !isOnboardingRoute) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

// ---------- PUBLIC ROUTE ----------
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-olive-dark" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>

      <BrowserRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: { background: "#5A5A40", color: "#fff" },
            success: {
              iconTheme: { primary: "#B8B48F", secondary: "#fff" },
            },
          }}
        />


        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* PUBLIC */}
            <Route
              path="/"
              element={
                <PublicRoute>
                  <Landing />
                </PublicRoute>
              }
            />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              }
            />
            <Route
              path="/reset-password"
              element={
                <PublicRoute>
                  <ResetPassword />
                </PublicRoute>
              }
            />

            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/termini" element={<TerminiCondizioni />} />

            {/* PROTECTED */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              {/* Dashboard utente */}
              <Route path="/dashboard" element={<Dashboard />} />

              <Route path="/saga/:id/intro" element={<SagaIntro />} />
              <Route path="/saga/:id" element={<SagaDetail />} />
              <Route path="/profilo" element={<Profilo />} />
              <Route path="/missioni" element={<Missioni />} />

              {/* Pagina Premi Mensili */}


              {/* Onboarding interessi */}
              <Route path="/onboarding" element={<OnboardingInteressi />} />

              {/* Chat */}


              {/* Partner */}
              <Route path="/partner" element={<Partner />} />
              <Route path="/partner/:id" element={<PartnerDetail />} />
              <Route path="/partner/join" element={<PartnerJoin />} />
              <Route path="/partner/dashboard" element={<PartnerDashboard />} />
              <Route path="/partner/:id/pin" element={<PinPad />} />


              {/* Mercato */}
              <Route path="/mappa" element={<Mappa />} />
              <Route path="/album" element={<Album />} />
              <Route path="/eventi" element={<Eventi />} />
              <Route path="/eventi/:id" element={<EventDetail />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/shop/:itemId" element={<MarketItemDetail />} />
              <Route
                path="/shop/success"
                element={<MarketPurchaseSuccess />}
              />

              {/* Ordini */}
              <Route path="/orders" element={<MyOrders />} />

              {/* 🗺️ LOCAL CONCIERGE */}
              <Route path="/daily-plans" element={<DailyPlans />} />
              <Route path="/plan/:id" element={<PlanDetail />} />
              <Route path="/vibe-radar" element={<VibeRadar />} />


              {/* Contatti */}




              {/* Voucher */}
              <Route path="/voucher" element={<VoucherList />} />

              {/* ⭐️ EVENTI CLUB */}


              {/* Admin */}
              <Route path="/admin" element={<AdminDashboard />} />

              <Route path="/admin/partner" element={<AdminPartners />} />
              <Route path="/admin/cards" element={<AdminCards />} />
              {/* <Route path="/admin/offerte" element={<AdminOffers />} /> Removed legacy route */}
              <Route path="/admin/transazioni" element={<AdminTransazioni />} />


            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>

      </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;