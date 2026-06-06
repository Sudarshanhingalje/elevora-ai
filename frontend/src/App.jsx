import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Marketplace from "./pages/Marketplace.jsx";
import Pricing from "./pages/Pricing.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import Signup from "./pages/Signup.jsx";
import UserDashboard from "./pages/UserDashboard.jsx";
import CheckoutSuccess from "./pages/CheckoutSuccess.jsx";
import CheckoutFailed from "./pages/CheckoutFailed.jsx";
import BillingPage from "./pages/BillingPage.jsx";
import SubscriptionPage from "./pages/SubscriptionPage.jsx";

// Newly Implemented Pages (W15-24)
import RevenueDashboard from "./pages/RevenueDashboard.jsx";
import AdminReports from "./pages/AdminReports.jsx";
import GrowthMetrics from "./pages/GrowthMetrics.jsx";
import CrmAIDashboard from "./pages/CrmAIDashboard.jsx";
import AutomationEngine from "./pages/AutomationEngine.jsx";
import SupportCenter from "./pages/SupportCenter.jsx";
import TicketDetails from "./pages/TicketDetails.jsx";
import FeedbackForm from "./pages/FeedbackForm.jsx";
import UserSettings from "./pages/UserSettings.jsx";
import NotificationsPanel from "./pages/NotificationsPanel.jsx";
import AnalyticsDashboard from "./pages/AnalyticsDashboard.jsx";
import MarketplaceCategory from "./pages/MarketplaceCategory.jsx";
import CookieConsent from "./components/common/CookieConsent.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-50">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
        <Route path="/marketplace/categories" element={<ProtectedRoute><MarketplaceCategory /></ProtectedRoute>} />
        <Route path="/product/:slug" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
        <Route path="/marketplace/:slug" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
        <Route path="/pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
        <Route path="/subscription" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
        <Route path="/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
        <Route path="/checkout/success" element={<ProtectedRoute><CheckoutSuccess /></ProtectedRoute>} />
        <Route path="/checkout/failed" element={<ProtectedRoute><CheckoutFailed /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
        
        {/* W15-W24 Protected Routes */}
        <Route path="/dashboard/revenue" element={<ProtectedRoute adminOnly><RevenueDashboard /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute adminOnly><AdminReports /></ProtectedRoute>} />
        <Route path="/dashboard/growth" element={<ProtectedRoute adminOnly><GrowthMetrics /></ProtectedRoute>} />
        <Route path="/admin/leads-generator" element={<ProtectedRoute adminOnly><CrmAIDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/automation" element={<ProtectedRoute adminOnly><AutomationEngine /></ProtectedRoute>} />
        <Route path="/dashboard/analytics" element={<ProtectedRoute adminOnly><AnalyticsDashboard /></ProtectedRoute>} />
        <Route path="/support" element={<ProtectedRoute><SupportCenter /></ProtectedRoute>} />
        <Route path="/support/ticket/:id" element={<ProtectedRoute><TicketDetails /></ProtectedRoute>} />
        <Route path="/feedback" element={<ProtectedRoute><FeedbackForm /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><UserSettings /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPanel /></ProtectedRoute>} />
        
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <CookieConsent />
    </div>
  );
}

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-[#0F172A] text-white">Checking secure session...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (adminOnly && user.role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

