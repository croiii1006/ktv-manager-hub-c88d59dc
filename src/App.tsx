import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";

import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Login from "./pages/Login";
import Layout from "./components/Layout"; // We will use Layout component directly
import TeamLeaderManagement from "./pages/TeamLeaderManagement";
import SalespersonManagement from "./pages/SalespersonManagement";
import UserManagement from "./pages/UserManagement";
import RechargeRecords from "./pages/RechargeRecords";
import ConsumeRecords from "./pages/ConsumeRecords";
import RoomBooking from "./pages/RoomBooking";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const GlobalLoader = () => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleLoading = (e: Event) => {
      const customEvent = e as CustomEvent<boolean>;
      setLoading(customEvent.detail);
    };

    window.addEventListener('app-loading', handleLoading);
    return () => window.removeEventListener('app-loading', handleLoading);
  }, []);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 w-full z-50">
      <div className="h-1 w-full bg-primary/20 overflow-hidden">
        <div className="animate-progress w-full h-full bg-primary origin-left-right"></div>
      </div>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <GlobalLoader />

      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* 默认进入登录页面 */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* 登录页（无保护） */}
            <Route path="/login" element={<Login />} />

            {/* Dashboard 路由组 */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="team-leaders" replace />} />
              <Route path="team-leaders" element={<TeamLeaderManagement />} />
              <Route path="salespersons" element={<SalespersonManagement />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="recharge" element={<RechargeRecords />} />
              <Route path="consume" element={<ConsumeRecords />} />
              <Route path="rooms" element={<RoomBooking />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
