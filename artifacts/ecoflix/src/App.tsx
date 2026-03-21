import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Home from "./pages/Home";
import Search from "./pages/Search";
import MovieDetail from "./pages/MovieDetail";
import TVDetail from "./pages/TVDetail";
import Player from "./pages/Player";
import Browse from "./pages/Browse";
import Ranking from "./pages/Ranking";
import Wishlist from "./pages/Wishlist";
import Category from "./pages/Category";
import WatchHistory from "./pages/WatchHistory";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    }
  }
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/search" component={Search} />
      <Route path="/browse" component={Browse} />
      <Route path="/category/:slug" component={Category} />
      <Route path="/ranking" component={Ranking} />
      <Route path="/wishlist" component={Wishlist} />
      <Route path="/history" component={WatchHistory} />
      <Route path="/movie/:id" component={MovieDetail} />
      <Route path="/tv/:id" component={TVDetail} />
      <Route path="/player" component={Player} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
