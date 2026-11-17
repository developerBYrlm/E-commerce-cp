import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
const Home = lazy(() => import("./pages/Home"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const CollectionPage = lazy(() => import("./pages/CollectionPage"));
const DetailPage = lazy(() => import("./pages/DetailPage"));
const FeedPage = lazy(() => import("./pages/FeedPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
import NotFound from "./pages/NotFound";
const SearchPage = lazy(() => import("./pages/SearchPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const PaymentResultPage = lazy(() => import("./pages/PaymentResultPage"));
import { Loader } from "./components/Loader";
import { useAuth } from "./contexts/AuthContext";
import api from "./api/client";
import toast from "react-hot-toast";

function SessionGate({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function VerifyEmailPage() {
  const token = new URLSearchParams(window.location.search).get("token");
  async function verify() {
    try { const { data } = await api.post("/auth/verify-email", { token }); toast.success(data.message); }
    catch (error) { toast.error(error.message); }
  }
  return <div className="mx-auto max-w-xl px-5 py-24 text-center"><h1 className="text-3xl font-bold text-forest">Verify your email</h1><p className="mt-3 text-slate-500">Confirm your email address to complete your LocalSphere profile.</p><button disabled={!token} onClick={verify} className="btn mt-6 rounded-full border-0 bg-forest text-white">Verify email</button></div>;
}

function RoleDashboard({ tab }) {
  return <SessionGate><DashboardPage initialTab={tab} /></SessionGate>;
}

export default function App() {
  return <Suspense fallback={<Loader />}><Routes><Route element={<MainLayout />}>
    <Route index element={<Home />} />
    <Route path="login" element={<AuthPage />} />
    <Route path="register" element={<AuthPage mode="register" />} />
    <Route path="forgot-password" element={<AuthPage mode="forgot" />} />
    <Route path="reset-password" element={<AuthPage mode="reset" />} />
    <Route path="verify-email" element={<VerifyEmailPage />} />
    <Route path="search" element={<SearchPage />} />
    <Route path="shops" element={<CollectionPage kind="shops" />} />
    <Route path="shops/:id" element={<DetailPage kind="shops" />} />
    <Route path="products" element={<CollectionPage kind="products" />} />
    <Route path="products/:id" element={<DetailPage kind="products" />} />
    <Route path="services" element={<CollectionPage kind="services" />} />
    <Route path="services/:id" element={<DetailPage kind="services" />} />
    <Route path="feed" element={<FeedPage />} />
    <Route path="feed/:id" element={<FeedPage />} />
    <Route path="dashboard" element={<RoleDashboard />} />
    <Route path="orders" element={<RoleDashboard tab="orders" />} />
    <Route path="bookings" element={<RoleDashboard tab="bookings" />} />
    <Route path="cart" element={<CartPage />} />
    <Route path="payment-result" element={<PaymentResultPage />} />
    <Route path="messages" element={<SessionGate><MessagesPage /></SessionGate>} />
    <Route path="notifications" element={<SessionGate><NotificationsPage /></SessionGate>} />
    <Route path="admin/*" element={<SessionGate roles={["admin"]}><DashboardPage initialTab="overview" /></SessionGate>} />
    <Route path="owner/*" element={<SessionGate roles={["owner"]}><DashboardPage initialTab="shop" /></SessionGate>} />
    <Route path="*" element={<NotFound />} />
  </Route></Routes></Suspense>;
}
