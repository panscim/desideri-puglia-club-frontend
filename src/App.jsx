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

// 🚀 LAZY LOADED PAGES - Only loaded when needed
// Pages (pubbliche)
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.jsx"));

// Pages (protette)
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Missioni = lazy(() => import("./pages/Missioni"));
const MissionDetail = lazy(() => import("./pages/MissionDetail"));
const Classifica = lazy(() => import("./pages/Classifica"));
const Profilo = lazy(() => import("./pages/Profilo.jsx"));
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
const AcquistaGettoni = lazy(() => import("./pages/AcquistaGettoni.jsx"));
const BoostAcquista = lazy(() => import("./pages/BoostAcquista.jsx"));

// Mappa (lazy loaded)
const Mappa = lazy(() => import("./pages/Mappa"));


// Onboarding interessi
const OnboardingInteressi = lazy(() => import("./pages/OnboardingInteressi"));

// Chat
const Chat = lazy(() => import("./pages/Chat"));

// NUOVE PAGINE PROFILO
const Contatti = lazy(() => import("./pages/Contatti.jsx"));


// ⭐️ PAGINA PREMI MENSILI
const Premi = lazy(() => import("./pages/Premi"));

// Admin
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminMissions = lazy(() => import("./pages/admin/AdminMissions"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminPrizes = lazy(() => import("./pages/admin/AdminPrizes"));
const AdminPartners = lazy(() => import("./pages/admin/AdminPartners"));
// (AdminOffers removed)
const AdminTransazioni = lazy(() => import("./pages/admin/AdminTransazioni.jsx"));
const AdminCards = lazy(() => import("./pages/admin/AdminCards.jsx"));

// ⭐️ NEW ALBUM PAGE
const Album = lazy(() => import("./pages/Album"));


// ⭐️ EVENTI CLUB
const Eventi = lazy(() => import("./pages/Eventi"));
const EventiDetail = lazy(() => import("./pages/EventiDetail.jsx"));
const EventiSuccess = lazy(() => import("./pages/EventiSuccess"));

// Layout - Keep layout eager for better UX
import Layout from "./components/Layout";

// 📲 PWA install banner - Keep eager as it's small and important
import PwaInstallPrompt from "./components/PwaInstallPrompt";

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
              <Route path="/missioni" element={<Missioni />} />
              <Route path="/missioni-classifica" element={<MissioniClassifica />} />
              <Route path="/missione/:id" element={<MissionDetail />} />
              <Route path="/classifica" element={<Classifica />} />
              <Route path="/profilo" element={<Profilo />} />

              {/* Pagina Premi Mensili */}
              <Route path="/premi" element={<Premi />} />

              {/* Onboarding interessi */}
              <Route path="/onboarding" element={<OnboardingInteressi />} />

              {/* Chat */}
              <Route path="/chat" element={<Chat />} />

              {/* Partner */}
              <Route path="/partner" element={<Partner />} />
              <Route path="/partner/:id" element={<PartnerDetail />} />
              <Route path="/partner/join" element={<PartnerJoin />} />
              <Route path="/partner/dashboard" element={<PartnerDashboard />} />
              <Route path="/partner/:id/pin" element={<PinPad />} />
              <Route path="/partner/acquista-gettoni" element={<AcquistaGettoni />} />
              <Route path="/boost" element={<BoostAcquista />} />


              {/* Mercato */}
              <Route path="/mappa" element={<Mappa />} />
              <Route path="/album" element={<Album />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/shop/:itemId" element={<MarketItemDetail />} />
              <Route
                path="/shop/success"
                element={<MarketPurchaseSuccess />}
              />

              {/* Ordini */}
              <Route path="/orders" element={<MyOrders />} />

              {/* Contatti */}
              <Route path="/contatti" element={<Contatti />} />



              {/* Voucher */}
              <Route path="/voucher" element={<VoucherList />} />

              {/* ⭐️ EVENTI CLUB */}
              <Route path="/eventi" element={<Eventi />} />
              <Route path="/eventi/:eventId" element={<EventiDetail />} />
              <Route path="/eventi/success" element={<EventiSuccess />} />

              {/* Admin */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/missions" element={<AdminMissions />} />
              <Route path="/admin/premi" element={<AdminPrizes />} />
              <Route path="/admin/partner" element={<AdminPartners />} />
              <Route path="/admin/cards" element={<AdminCards />} />
              {/* <Route path="/admin/offerte" element={<AdminOffers />} /> Removed legacy route */}
              <Route path="/admin/transazioni" element={<AdminTransazioni />} />

            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>


        {/* Popup install PWA (Android: prompt nativo, iOS: istruzioni) */}
        <PwaInstallPrompt />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;