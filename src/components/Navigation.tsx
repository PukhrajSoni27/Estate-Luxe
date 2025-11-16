import { useEffect, useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { Menu, X, Home, Calculator, TrendingUp, BarChart3, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";
import siteLogo from "@/assets/Estate Luxe at Golden Hour.png";

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("auth:user") || "null");
    } catch {
      return null;
    }
  })();
  const [active, setActive] = useState<string>("#home");
  const [scrolled, setScrolled] = useState(false);
  const [logoOk, setLogoOk] = useState(true);
  const isCalculator = (typeof window !== 'undefined') && window.location.pathname === '/calculator';
  const initials = (() => {
    const base = (user?.name || user?.email || "").trim();
    if (!base) return "PP";
    const parts = base.split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return base.slice(0, 2).toUpperCase();
  })();

  const scrollTo = (id: string) => {
    const el = document.querySelector(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
      const sections = ["#home", "#valuation", "#insights", "#calculator", "#contact"];
      for (const id of sections) {
        const el = document.querySelector(id) as HTMLElement | null;
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= 120 && rect.bottom >= 120) {
          setActive(id);
          break;
        }
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menu on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener('keydown', onKey);
    }
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  // Lock body scroll when menu is open
  useEffect(() => {
    const original = document.body.style.overflow;
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, [isOpen]);

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Features", href: "/features", icon: Home },
    { name: "Valuation", href: "#valuation", icon: Calculator },
    { name: "Market Insights", href: "#insights", icon: TrendingUp },
    { name: "Calculator", href: "#calculator", icon: BarChart3 },
    { name: "Contact", href: "#contact", icon: Phone },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b ${scrolled ? 'bg-background/70 border-border/50' : 'bg-background/40 border-transparent'}`}>
      <div className="max-w-7xl mx-auto px-0 sm:px-1 lg:px-2">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center -ml-8 sm:-ml-12 lg:-ml-16">
            <button
              type="button"
              aria-label="Open menu"
              aria-haspopup="menu"
              aria-expanded={isOpen}
              onClick={() => setIsOpen((v) => !v)}
              className="flex items-center gap-2 focus:outline-none"
            >
              {logoOk && (
                <img
                  src={siteLogo}
                  alt="Estate Luxe logo"
                  className="h-8 w-auto rounded-sm shadow-sm"
                  onError={() => setLogoOk(false)}
                />
              )}
              <div className="text-2xl font-bold text-foreground">Estate Luxe</div>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-1 glass rounded-full px-2 py-1 border-border/50">
              {navItems.map((item) => {
                const isActive = item.href === '/' ? active === '#home' : active === item.href;
                return (
                  <a
                    key={item.name}
                    href={item.href.replace('#', '/')}
                    className={`hover-ripple px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:bg-muted/60 ${isActive ? 'text-foreground bg-muted/60' : 'text-foreground/80 hover:text-foreground'}`}
                    onMouseMove={(e) => {
                      const target = e.currentTarget as HTMLElement;
                      const rect = target.getBoundingClientRect();
                      target.style.setProperty('--ripple-x', `${e.clientX - rect.left}px`);
                      target.style.setProperty('--ripple-y', `${e.clientY - rect.top}px`);
                    }}
                  >
                    {item.name}
                  </a>
                );
              })}
            </div>
          </div>

          {/* CTA / Profile */}
          <div className="hidden md:block">
            {user ? (
              <div className="flex items-center gap-2">
                <a href="/profile" className="group flex items-center gap-2 px-2 py-1 rounded-full hover:bg-muted/60 transition-colors">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full overflow-hidden border border-border/50 bg-muted/30">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-semibold text-foreground/80">{initials}</span>
                    )}
                  </span>
                  <span className="hidden lg:inline text-sm font-medium text-foreground/80 group-hover:text-foreground">Profile</span>
                </a>
                {!isCalculator && (
                  <Button
                    variant="outline"
                    className="text-sm rounded-full border-primary/60 text-primary hover:bg-primary hover:text-primary-foreground px-4 py-2"
                    onClick={() => {
                      try { localStorage.removeItem('auth:user'); } catch {}
                      window.location.href = '/';
                    }}
                  >
                    Logout
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <a href="/login" className="text-foreground/80 hover:text-foreground px-3 py-2 rounded-md text-sm font-medium">Login</a>
                <a href="/signup">
                  <Button variant="outline" className="text-sm font-semibold rounded-full border-primary/60 text-primary hover:bg-primary hover:text-primary-foreground px-4 py-2">
                    Sign Up
                  </Button>
                </a>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-foreground hover:text-foreground/80 transition-colors"
            >
              {isOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Backdrop + Menu Panel (visible on all breakpoints when open) */}
      {isOpen && (
        <>
          {/* Local animation keyframes */}
          <style>{`
            @keyframes chocoIn { from { opacity: 0; transform: translateY(-8px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
          `}</style>
          {/* Backdrop to focus the panel */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative z-50">
            <div className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-4 mt-3">
              <div className="mx-auto max-w-sm sm:max-w-md rounded-2xl shadow-elegant p-2 border border-[#3d2b20]/50 bg-gradient-to-br from-[#1a1410]/95 via-[#120e0b]/95 to-[#0d0a08]/95 animate-[chocoIn_180ms_ease-out]">
                {/* top ridge */}
                <div className="h-1 rounded-t-2xl bg-[#3a2a20]/60 mb-2" />
                {user && (
                  <a
                    href="/profile"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 hover:ring-1 hover:ring-[#CBA13533] transition-colors border border-white/5 mb-1"
                    onClick={() => setIsOpen(false)}
                  >
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full overflow-hidden border border-border/50 bg-muted/30">
                      {user?.avatar ? (
                        <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-semibold text-foreground/80">{initials}</span>
                      )}
                    </span>
                    <span className="text-sm font-medium">Profile</span>
                  </a>
                )}
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.name}
                      href={item.href.replace('#', '/')}
                      className="text-foreground/80 hover:text-foreground flex items-center px-3 py-2 rounded-lg text-base font-medium transition-all duration-300 hover:bg-white/5 hover:ring-1 hover:ring-[#CBA13533] border border-white/5 mb-1"
                      onClick={() => setIsOpen(false)}
                    >
                      <Icon className="h-5 w-5 mr-3 text-[#CBA135]" />
                      {item.name}
                    </a>
                  );
                })}
                <div className="px-3 py-2">
                  <Button
                    className="btn-premium w-full rounded-lg"
                    onClick={() => {
                      setIsOpen(false);
                      scrollTo("#valuation");
                      toast({ title: "Let's get your valuation", description: "Scroll down to the form." });
                    }}
                  >
                    Get Started
                  </Button>
                </div>
                {/* bottom ridge */}
                <div className="h-1 rounded-b-2xl bg-[#3a2a20]/60 mt-2" />
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
};