import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import About from "./pages/About";
import Admin from "./pages/Admin";
import AnnouncementEditor from "./pages/AnnouncementEditor";
import Contact from "./pages/Contact";
import Enroll from "./pages/Enroll";
import FounderLogin from "./pages/FounderLogin";
import FounderLearningData from "./pages/FounderLearningData";
import FounderOperations from "./pages/FounderOperations";
import Home from "./pages/Home";
import LearningHub from "./pages/LearningHub";
import News from "./pages/News";
import NotFound from "./pages/NotFound";
import ProgramDetail from "./pages/ProgramDetail";
import Programs from "./pages/Programs";

function Router() { const [location] = useLocation(); return <div key={location} className="route-enter"><Switch><Route path="/" component={Home} /><Route path="/programs" component={Programs} /><Route path="/programs/:slug" component={ProgramDetail} /><Route path="/about" component={About} /><Route path="/news" component={News} /><Route path="/contact" component={Contact} /><Route path="/enroll" component={Enroll} /><Route path="/learning" component={LearningHub} /><Route path="/admin/login" component={FounderLogin} /><Route path="/admin/learning-data" component={FounderLearningData} /><Route path="/admin/operations" component={FounderOperations} /><Route path="/admin/announcements/edit" component={AnnouncementEditor} /><Route path="/admin/:rest*?" component={Admin} /><Route path="/admin" component={Admin} /><Route path="/404" component={NotFound} /></Switch></div>; }
function App() { return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>; }
export default App;
