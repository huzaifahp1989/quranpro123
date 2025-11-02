import { Switch, Route, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Book } from "lucide-react";
import QuranReader from "@/pages/QuranReader";
import HadithBrowser from "@/pages/HadithBrowser";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={QuranReader} />
      <Route path="/hadith" component={HadithBrowser} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
        
        <Link href="/hadith">
          <Button
            size="icon"
            variant="default"
            className="fixed bottom-36 left-6 h-14 w-14 rounded-full shadow-lg z-30"
            data-testid="button-navigate-hadith"
            aria-label="Browse Hadiths"
          >
            <Book className="w-6 h-6" />
          </Button>
        </Link>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
