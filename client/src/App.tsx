import React from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";

import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Enroll from "./pages/Enroll";
import FounderLogin from "./pages/FounderLogin";
import Programs from "./pages/Programs";
import ProgramDetail from "./pages/ProgramDetail";
import News from "./pages/News";
import UserDashboard from "./pages/UserDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import MarketingDashboard from "./pages/MarketingDashboard";
import Admin from "./pages/Admin";
import SuperAdmin from "./pages/SuperAdmin";
import NotFound from "./pages/NotFound";

function ScrollToTop() {
  const [location] = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}

function Router({ location }: { location?: string }) {
  return (
    <Switch location={location}>
      {/* Public Pages */}
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/enroll" component={Enroll} />
      <Route path="/login" component={FounderLogin} />
      <Route path="/programs" component={Programs} />
      <Route path="/programs/:slug" component={ProgramDetail} />
      <Route path="/news" component={News} />

      {/* Portals & Dashboards */}
      <Route path="/dashboard" component={UserDashboard} />
      <Route path="/teacher" component={TeacherDashboard} />
      <Route path="/marketing" component={MarketingDashboard} />

      {/* Admin Canonical Paths */}
      <Route path="/admin" component={Admin} />
      <Route path="/admin/users" component={Admin} />
      <Route path="/admin/students" component={Admin} />
      <Route path="/admin/students/:id" component={Admin} />
      <Route path="/admin/news" component={Admin} />
      <Route path="/admin/media" component={Admin} />
      <Route path="/admin/audit-logs" component={Admin} />

      {/* Super Admin Canonical Paths */}
      <Route path="/super-admin" component={SuperAdmin} />
      <Route path="/super-admin/users" component={SuperAdmin} />
      <Route path="/super-admin/audit-logs" component={SuperAdmin} />

      {/* Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const [displayLocation, setDisplayLocation] = React.useState(location);
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [opacity, setOpacity] = React.useState(0);

  React.useEffect(() => {
    if (location !== displayLocation) {
      setIsTransitioning(true);
      setOpacity(1);

      const timer1 = setTimeout(() => {
        setDisplayLocation(location);
        setOpacity(0);

        const timer2 = setTimeout(() => {
          setIsTransitioning(false);
        }, 150);

        return () => clearTimeout(timer2);
      }, 150);

      return () => clearTimeout(timer1);
    }
  }, [location, displayLocation]);

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster />
            <ScrollToTop />
            {(isTransitioning || opacity > 0) && (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  backgroundColor: "#ffffff",
                  zIndex: 999999,
                  opacity: opacity,
                  transition: "opacity 150ms ease-in-out",
                  pointerEvents: "all",
                }}
              />
            )}
            <Router location={displayLocation} />
          </TooltipProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
