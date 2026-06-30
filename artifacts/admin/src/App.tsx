import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider, SignIn, useAuth } from "@clerk/react";
import { useEffect } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import Dashboard from "@/pages/dashboard";
import Reports from "@/pages/reports";
import Users from "@/pages/users";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

function AppRoutes() {
  const { isSignedIn, isLoaded, getToken } = useAuth();

  useEffect(() => {
    setAuthTokenGetter(() => getToken());
  }, [getToken]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground mb-1">PowerPulse Admin</div>
            <div className="text-sm text-muted-foreground">Sign in to access the admin panel</div>
          </div>
          <SignIn routing="hash" />
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/reports" component={Reports} />
        <Route path="/users" component={Users} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  if (!publishableKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">Configuration Error</div>
          <div className="text-sm text-muted-foreground">CLERK_PUBLISHABLE_KEY is not set.</div>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppRoutes />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;
