import { useState } from "react";
import { BookOpen, GraduationCap, Book, Menu, X, Moon, Sun } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  testId: string;
}

interface TopNavProps {
  title: string;
  subtitle?: string;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  pageIcon?: 'quran' | 'kids' | 'hadith' | 'fiqh' | 'surahs' | 'stories';
}

export function TopNav({ title, subtitle, theme, onThemeToggle, pageIcon }: TopNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();

  const navItems: NavItem[] = [
    { name: "Quran", href: "/", icon: <BookOpen className="w-4 h-4" />, testId: "button-nav-quran" },
    { name: "Surahs", href: "/surahs", icon: <BookOpen className="w-4 h-4" />, testId: "button-nav-surahs" },
    { name: "Stories", href: "/stories", icon: <BookOpen className="w-4 h-4" />, testId: "button-nav-stories" },
    { name: "Fiqh", href: "/fiqh", icon: <Book className="w-4 h-4" />, testId: "button-nav-fiqh" },
    { name: "Kids", href: "/kids", icon: <GraduationCap className="w-4 h-4" />, testId: "button-nav-kids" },
    { name: "Hadith", href: "/hadith", icon: <Book className="w-4 h-4" />, testId: "button-nav-hadith" },
  ];

  const isActive = (href: string) => location === href || (href === "/" && location === "/");

  const getPageIcon = () => {
    switch (pageIcon) {
      case 'quran':
        return <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />;
      case 'kids':
        return <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />;
      case 'hadith':
        return <Book className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />;
      case 'fiqh':
        return <Book className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />;
      case 'surahs':
        return <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />;
      case 'stories':
        return <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />;
      default:
        return <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          {/* Logo & Title */}
          <Link href="/">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 cursor-pointer hover-elevate">
              <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 shrink-0">
                {getPageIcon()}
              </div>
              <div className="min-w-0 hidden sm:block">
                <h1 className="text-base sm:text-lg font-semibold truncate">{title}</h1>
                {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive(item.href) ? "default" : "outline"}
                  size="sm"
                  data-testid={item.testId}
                  className="gap-2"
                >
                  {item.icon}
                  <span className="hidden lg:inline">{item.name}</span>
                </Button>
              </Link>
            ))}
            <Button
              size="icon"
              variant="ghost"
              onClick={onThemeToggle}
              data-testid="button-theme-toggle"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={onThemeToggle}
              data-testid="button-theme-toggle"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  data-testid="button-menu-toggle"
                  aria-label="Toggle menu"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <nav className="flex flex-col gap-2 mt-8">
                  {navItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive(item.href) ? "default" : "ghost"}
                        className="w-full justify-start gap-3 text-base"
                        onClick={() => setIsOpen(false)}
                        data-testid={item.testId}
                      >
                        {item.icon}
                        {item.name}
                      </Button>
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
