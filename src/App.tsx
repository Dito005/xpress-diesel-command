import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import { SessionProvider, useSession } from "./components/SessionProvider";

const queryClient = new QueryClient();

// Component to handle routing based on session state
const AppRoutes = () => {
  const { session, isLoading } = useSession();

  // If not loading and no session, immediately navigate to login
  if (!isLoading && !session) {
    return <Navigate to="/login" replace />;
  }

  // While loading, or if session exists, render the routes
  // The "Loading authentication..." message is now handled by not rendering anything
  // until the session is determined, then immediately redirecting or showing content.
  if (isLoading) {
    return null; // Or a very minimal, quick loading indicator if absolutely necessary
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      {session ? (
        // If session exists, allow access to dashboard and other private routes
        <Route path="/" element={<Index />} />
      ) : (
        // This case should ideally be caught by the initial !isLoading && !session check
        // but kept as a fallback.
        <Route path="/" element={<Navigate to="/login" replace />} />
      )}
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