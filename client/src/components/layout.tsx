import { Link, useLocation } from "wouter";
import { Home, Search, PlusSquare, Heart, User, LogOut, Menu, Sun, Moon, Clapperboard, MessageCircle, Compass, Settings } from "lucide-react";
import logo from "@assets/generated_images/novii_app_logo.png";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import SuggestionsSidebar from "./suggestions-sidebar";
import { useLanguage } from "@/lib/language-context";
import { getTranslation } from "@/lib/translations";
import { useAuth } from "@/lib/auth-context";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const { language, direction } = useLanguage();
  const t = getTranslation(language.code).nav;
  const [mounted, setMounted] = useState(false);
  const { signOut } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const NavItem = ({ href, icon: Icon, label, isActive, badge }: { href: string, icon: any, label: string, isActive?: boolean, badge?: number }) => (
    <Link href={href}>
      <div className={cn(
        "flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group hover:bg-accent/50 relative cursor-pointer",
        isActive ? "font-bold text-foreground" : "text-muted-foreground hover:text-foreground"
      )}>
        <Icon 
          className={cn(
            "w-6 h-6 transition-transform duration-200 group-hover:scale-110", 
            isActive && "stroke-[3px] text-primary"
          )} 
        />
        <span className="text-md hidden lg:inline">{label}</span>
        {badge && (
          <span className="absolute right-2 top-2 md:top-auto md:right-4 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white animate-in zoom-in">
            {badge}
          </span>
        )}
      </div>
    </Link>
  );

  // Determine if we should show the mobile header
  // We hide it on Reels, Messages, Settings for a more immersive/native feel if desired, or just keep it simple.
  // Let's keep it simple: Show mobile header on Home, Explore, Notifications. Hide on others if they have their own headers.
  const hasOwnHeader = location === '/messages' || location === '/settings' || location === '/reels';
  const isHome = location === '/';

  return (
    <div 
      className="min-h-screen bg-background text-foreground flex flex-col md:flex-row justify-center transition-colors duration-300"
      dir={direction}
    >
      
      {/* Navigation Sidebar */}
      <aside className="order-1 hidden md:flex flex-col w-20 lg:w-64 h-screen sticky top-0 p-4 lg:p-6 z-50 border-e border-border/40">
        <div className="mb-10 px-2 flex items-center gap-3 justify-center lg:justify-start">
            <img src={logo} alt="Novii" className="w-8 h-8 rounded-xl shadow-lg shadow-primary/20" />
            <span className="font-display font-bold text-2xl tracking-tight bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent hidden lg:block">Novii</span>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem href="/" icon={Home} label={t.home} isActive={location === "/"} />
          <NavItem href="/explore" icon={Search} label={t.search} isActive={location === "/explore"} />
          <NavItem href="/explore" icon={Compass} label={t.explore} />
          <NavItem href="/reels" icon={Clapperboard} label={t.reels} isActive={location === "/reels"} />
          <NavItem href="/messages" icon={MessageCircle} label={t.messages} badge={4} />
          <NavItem href="/notifications" icon={Heart} label={t.notifications} badge={3} />
          <NavItem href="/create" icon={PlusSquare} label={t.create} />
          <NavItem href="/profile" icon={User} label={t.profile} isActive={location === "/profile"} />
          <NavItem href="/settings" icon={Settings} label={t.settings} isActive={location === "/settings"} />
        </nav>

        <div className="mt-auto space-y-4">
             <div className="px-2 flex justify-center lg:justify-start">
                <div className="flex items-center gap-2 p-1 bg-secondary/50 rounded-full w-fit">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn("rounded-full h-8 w-8", theme === 'light' && "bg-background shadow-sm")}
                        onClick={() => setTheme('light')}
                    >
                        <Sun className="w-4 h-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn("rounded-full h-8 w-8", theme === 'dark' && "bg-background shadow-sm")}
                        onClick={() => setTheme('dark')}
                    >
                        <Moon className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <Button 
                variant="ghost" 
                className="w-full justify-center lg:justify-start gap-4 text-muted-foreground hover:text-destructive" 
                data-testid="button-logout"
                onClick={handleLogout}
            >
                <LogOut className="w-5 h-5" />
                <span className="hidden lg:inline">{t.logout}</span>
            </Button>
        </div>
      </aside>

      {/* Main Content Area - REMOVED MAX-WIDTH CONSTRAINT HERE to let pages control themselves */}
      <main className={cn(
        "order-2 flex-1 w-full border-x border-border/40 min-h-screen transition-colors duration-300 pb-20 md:pb-0",
        // Only apply max-width if it's the Home feed to keep it centered relative to suggestions
        // Actually, let's just let Home handle its own width too.
        // Just ensure we don't overflow horizontally.
        "overflow-x-hidden"
      )}>
        
        {/* Mobile Header */}
        {!hasOwnHeader && (
            <header className="md:hidden sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md px-4 h-14 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <img src={logo} alt="Novii" className="w-6 h-6 rounded-lg" />
                    <span className="font-display font-bold text-xl">Novii</span>
                </div>
                <div className="flex items-center gap-4">
                    <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    >
                        {mounted && theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    </Button>
                    <div className="relative">
                        <Heart className="w-6 h-6" />
                        <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-destructive"></span>
                    </div>
                    <MessageCircle className="w-6 h-6" />
                </div>
            </header>
        )}

        {children}
      </main>

      {/* Right Sidebar (Suggestions) - Only visible on Home Page */}
      {isHome && (
        <div className="order-3 hidden xl:block border-s border-border/40 w-96 sticky top-0 h-screen">
            <SuggestionsSidebar />
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-border bg-background/90 backdrop-blur-lg z-50 flex items-center justify-around px-2">
        <Link href="/">
            <div className="p-3 rounded-full active:scale-95 transition-transform cursor-pointer">
                <Home className={cn("w-6 h-6", location === "/" ? "text-primary stroke-[3px]" : "text-muted-foreground")} />
            </div>
        </Link>
        <Link href="/explore">
            <div className="p-3 rounded-full active:scale-95 transition-transform cursor-pointer">
                <Search className={cn("w-6 h-6", location === "/explore" ? "text-primary stroke-[3px]" : "text-muted-foreground")} />
            </div>
        </Link>
        <Link href="/reels">
            <div className="p-3 rounded-full active:scale-95 transition-transform cursor-pointer">
                <Clapperboard className={cn("w-6 h-6", location === "/reels" ? "text-primary stroke-[3px]" : "text-muted-foreground")} />
            </div>
        </Link>
        <Link href="/create">
            <div className="p-3 rounded-full active:scale-95 transition-transform cursor-pointer">
                <PlusSquare className="w-6 h-6 text-muted-foreground" />
            </div>
        </Link>
        <Link href="/profile">
            <div className="p-3 rounded-full active:scale-95 transition-transform cursor-pointer">
                <User className={cn("w-6 h-6", location === "/profile" ? "text-primary stroke-[3px]" : "text-muted-foreground")} />
            </div>
        </Link>
      </nav>
    </div>
  );
}
