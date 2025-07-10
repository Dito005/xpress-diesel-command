import React, { useEffect } from 'react'; // Added useEffect import
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider, useSession } from "@/components/SessionProvider";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { LoadingSkeleton } from "./components/LoadingSkeleton";
import ErrorBoundary from "./components/ErrorBoundary";
import { electronAPI } from "@/lib/electron";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
      <Route path="/*" element={session ? <Index /> : <Navigate to="/login" />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  useEffect(() => {
    if (electronAPI.isElectron()) {
      const handleAppClose = () => {
        // Handle app close event
      };
      electronAPI.on('app-close', handleAppClose);
      
      return () => {
        electronAPI.removeListener('app-close', handleAppClose); // Fixed: Added listener argument
      };
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <AppRoutes />
            <Toaster />
          </ErrorBoundary>
        </BrowserRouter>
      </SessionProvider>
    </QueryClientProvider>
  );
};

export default App;