import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import QuranReader from "@/pages/QuranReader";
import HadithBrowser from "@/pages/HadithBrowser";
import KidsLearning from "@/pages/KidsLearning";
import QuranicStories from "@/pages/QuranicStories";
import AllSurahs from "@/pages/AllSurahs";
import Fiqh from "@/pages/Fiqh";
import MemoQuran from "@/pages/MemoQuran";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={QuranReader} />
      <Route path="/hadith" component={HadithBrowser} />
      <Route path="/kids" component={KidsLearning} />
      <Route path="/stories" component={QuranicStories} />
      <Route path="/surahs" component={AllSurahs} />
      <Route path="/fiqh" component={Fiqh} />
      <Route path="/memorize" component={MemoQuran} />
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
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
