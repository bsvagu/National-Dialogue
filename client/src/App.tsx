import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import LoginPage from "@/pages/login";
import MainLayout from "@/components/layout/main-layout";
import Dashboard from "@/pages/dashboard";
import Submissions from "@/pages/submissions";
import Cases from "@/pages/cases";
import Users from "@/pages/users";
import Departments from "@/pages/departments";
import Analytics from "@/pages/analytics";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-md-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-md-primary border-t-transparent rounded-md-full animate-spin mx-auto mb-4"></div>
          <p className="text-md-surface-on-variant md-body-large">Loading National Dialogue Admin Portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/submissions" component={Submissions} />
        <Route path="/cases" component={Cases} />
        <Route path="/users" component={Users} />
        <Route path="/departments" component={Departments} />
        <Route path="/analytics" component={Analytics} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="nd-admin-ui-theme">
        <TooltipProvider>
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
