import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import About from "./pages/About";
import Admin from "./pages/Admin";
import Contact from "./pages/Contact";
import Enroll from "./pages/Enroll";
import FounderLogin from "./pages/FounderLogin";
import Home from "./pages/Home";
import News from "./pages/News";
import NotFound from "./pages/NotFound";
import ProgramDetail from "./pages/ProgramDetail";
import Programs from "./pages/Programs";
import SuperAdmin from "./pages/SuperAdmin";
import UserDashboard from "./pages/UserDashboard";

function Router() {
  const [location] = useLocation();
  return <div key={location} className="route-enter"><Switch>
    <Route path="/" component={Home} />
    <Route path="/programs" component={Programs} />
    <Route path="/programs/:slug" component={ProgramDetail} />
    <Route path="/about" component={About} />
    <Route path="/news" component={News} />
    <Route path="/contact" component={Contact} />
    <Route path="/enroll" component={Enroll} />
    <Route path="/login" component={FounderLogin} />
    <Route path="/dashboard" component={UserDashboard} />
    <Route path="/super-admin/audit-logs" component={SuperAdmin} />
    <Route path="/super-admin/users" component={SuperAdmin} />
    <Route path="/super-admin" component={SuperAdmin} />
    <Route path="/admin/audit-logs" component={Admin} />
    <Route path="/admin/students/:studentId" component={Admin} />
    <Route path="/admin/students" component={Admin} />
    <Route path="/admin/users" component={Admin} />
    <Route path="/admin" component={Admin} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch></div>;
}

function App() { return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>; }
export default App;
