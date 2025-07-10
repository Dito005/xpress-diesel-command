import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import { SessionProvider, useSession } from "./components/SessionProvider";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

const AuthLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
  </div>
);

const AppRoutes = () => {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return <AuthLoading />;
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={!session ? <Login /> : <Navigate to="/" replace />} 
      />
      <Route 
        path="/" 
        element={session ? (
          <Suspense fallback={<AuthLoading />}>
            <Index />
          </Suspense>
        ) : <Navigate to="/login" replace />} 
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessionProvider>
          <Suspense fallback={<AuthLoading />}>
            <AppRoutes />
          </Suspense>
        </SessionProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;