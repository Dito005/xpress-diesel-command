import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "@/components/SessionProvider";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "./components/ErrorBoundary";
import { electronAPI } from "@/lib/electron";
import { ProtectedRoute } from './components/ProtectedRoute';

const queryClient = new QueryClient();

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/*" element={<Index />} />
      </Route>
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
        electronAPI.removeListener('app-close', handleAppClose);
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