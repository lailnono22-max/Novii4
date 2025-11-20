import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/lib/language-context";
import { AuthProvider } from "@/lib/auth-context";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Profile from "@/pages/profile";
import UserProfile from "@/pages/user-profile";
import Explore from "@/pages/explore";
import Reels from "@/pages/reels";
import Settings from "@/pages/settings";
import Messages from "@/pages/messages";
import Notifications from "@/pages/notifications";
import DevTasks from "@/pages/dev-tasks";
import AuthPage from "@/pages/auth";
import ProtectedLayout from "@/components/protected-layout";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage}/>
      
      <Route path="/">
        <ProtectedLayout>
          <Home />
        </ProtectedLayout>
      </Route>
      <Route path="/profile">
        <ProtectedLayout>
          <Profile />
        </ProtectedLayout>
      </Route>
      <Route path="/user">
        <ProtectedLayout>
          <UserProfile />
        </ProtectedLayout>
      </Route>
      <Route path="/explore">
        <ProtectedLayout>
          <Explore />
        </ProtectedLayout>
      </Route>
      <Route path="/reels">
        <ProtectedLayout>
          <Reels />
        </ProtectedLayout>
      </Route>
      <Route path="/settings">
        <ProtectedLayout>
          <Settings />
        </ProtectedLayout>
      </Route>
      <Route path="/messages">
        <ProtectedLayout>
          <Messages />
        </ProtectedLayout>
      </Route>
      <Route path="/notifications">
        <ProtectedLayout>
          <Notifications />
        </ProtectedLayout>
      </Route>
      <Route path="/tasks">
        <ProtectedLayout>
          <DevTasks />
        </ProtectedLayout>
      </Route>
      <Route path="/create">
        <ProtectedLayout>
          <Home />
        </ProtectedLayout>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <LanguageProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
