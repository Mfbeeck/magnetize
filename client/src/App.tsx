import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/navbar";
import { AboutModal } from "@/components/about-modal";
import Home from "@/pages/home";
import Results from "@/pages/results";
import Idea from "@/pages/idea";
import NotFound from "@/pages/not-found";
import { isFromShareLink } from "@/lib/utils";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/results/:publicId" component={Results} />
      <Route path="/results/:publicId/ideas/:id" component={Idea} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-slate-50">
          <Navbar 
            onAboutClick={() => setIsAboutModalOpen(true)}
            showGetStartedButton={isFromShareLink()}
            onGetStartedClick={() => window.location.href = "/"}
          />
          <div className="pt-16">
            <Router />
          </div>
          <AboutModal
            isOpen={isAboutModalOpen}
            onClose={() => setIsAboutModalOpen(false)}
          />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
