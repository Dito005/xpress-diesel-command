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

const queryClient = new QueryClient();

// A component to display while the session is loading
const AuthLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
  </div>
);

// Component to handle routing based on session state
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
        element={session ? <Index /> : <Navigate to="/login" replace />} 
      />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
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
          <AppRoutes />
        </SessionProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;