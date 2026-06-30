import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider, SignIn, SignUp, useAuth } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { useEffect } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

import Dashboard from "@/pages/dashboard";
import Reports from "@/pages/reports";
import Users from "@/pages/users";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";

import UserDashboard from "@/pages/user-dashboard";
import ReportForm from "@/pages/report-form";
import ReportDetail from "@/pages/report-detail";
import NotificationsPage from "@/pages/notifications-page";
import ProfilePage from "@/pages/profile-page";
import SavedLocationsPage from "@/pages/saved-locations-page";
import MapPage from "@/pages/map-page";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-6 w-full max-w-sm">
        <div className="text-center">
          <div className="text-2xl font-bold text-foreground mb-1">PowerPulse</div>
          <div className="text-sm text-muted-foreground">Community electricity reporting</div>
        </div>
        <SignIn routing="hash" forceRedirectUrl={`${basePath}/dashboard`} />
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-6 w-full max-w-sm">
        <div className="text-center">
          <div className="text-2xl font-bold text-foreground mb-1">PowerPulse</div>
          <div className="text-sm text-muted-foreground">Join your community</div>
        </div>
        <SignUp routing="hash" forceRedirectUrl={`${basePath}/dashboard`} />
      </div>
    </div>
  );
}

function AppRoutes() {
  const { isSignedIn, isLoaded, getToken } = useAuth();

  useEffect(() => {
    setAuthTokenGetter(() => getToken());
  }, [getToken]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Loading…</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <Switch>
        <Route path="/sign-up" component={SignUpPage} />
        <Route component={SignInPage} />
      </Switch>
    );
  }

  return (
    <Layout>
      <Switch>
        <Route path="/">
          <Redirect to="/dashboard" />
        </Route>
        {/* User routes */}
        <Route path="/dashboard" component={UserDashboard} />
        <Route path="/map" component={MapPage} />
        <Route path="/report/outage" component={ReportForm} />
        <Route path="/report/restoration" component={ReportForm} />
        <Route path="/report/transformer" component={ReportForm} />
        <Route path="/report/:id" component={ReportDetail} />
        <Route path="/notifications" component={NotificationsPage} />
        <Route path="/saved-locations" component={SavedLocationsPage} />
        <Route path="/profile" component={ProfilePage} />
        {/* Admin routes */}
        <Route path="/admin" component={Dashboard} />
        <Route path="/admin/reports" component={Reports} />
        <Route path="/admin/users" component={Users} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  if (!clerkPubKey) {
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
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      routerPush={(to) => { window.history.pushState(null, "", stripBase(to)); }}
      routerReplace={(to) => { window.history.replaceState(null, "", stripBase(to)); }}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={basePath}>
            <AppRoutes />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;
