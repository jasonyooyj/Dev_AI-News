'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Newspaper,
  LayoutDashboard,
  Database,
  Sun,
  Moon,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/',
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    label: 'Sources',
    href: '/sources',
    icon: <Database className="w-4 h-4" />,
  },
];

interface HeaderProps {
  onMenuClick?: () => void;
  isSidebarOpen?: boolean;
}

export function Header({ onMenuClick, isSidebarOpen }: HeaderProps) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
    const initialTheme = savedTheme || systemTheme;
    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);

  const toggleTheme = useCallback(async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isAnimating) return;
    setIsAnimating(true);

    const x = event.clientX;
    const y = event.clientY;

    // Calculate the maximum radius needed to cover the entire screen
    const maxRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // Set CSS variables for the reveal animation
    document.documentElement.style.setProperty('--reveal-x', `${x}px`);
    document.documentElement.style.setProperty('--reveal-y', `${y}px`);
    document.documentElement.style.setProperty('--reveal-radius', `${maxRadius}px`);

    const newTheme = theme === 'light' ? 'dark' : 'light';

    // Check if View Transitions API is supported
    const supportsViewTransitions = 'startViewTransition' in document;

    if (supportsViewTransitions) {
      // Use View Transitions API for smooth circular reveal
      const transition = (document as Document & { startViewTransition: (callback: () => void) => { finished: Promise<void> } }).startViewTransition(() => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
      });

      try {
        await transition.finished;
      } catch {
        // Transition was skipped or failed, but theme is already applied
      }
    } else {
      // Fallback for browsers without View Transitions
      setTheme(newTheme);
      localStorage.setItem('theme', newTheme);
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
    }

    setIsAnimating(false);
  }, [theme, isAnimating]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-3 sm:px-4 md:px-6">
        {/* Left: Logo and Mobile Menu */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="md"
            onClick={onMenuClick}
            className="lg:hidden touch-target"
            aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
          >
            {isSidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>

          <Link
            href="/"
            className="flex items-center gap-2.5 text-zinc-900 dark:text-zinc-100 hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white">
              <Newspaper className="w-4 h-4" />
            </div>
            <span className="font-semibold text-lg hidden sm:block">
              AI News Dashboard
            </span>
          </Link>
        </div>

        {/* Center: Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                  transition-all duration-150
                  ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }
                `}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Theme Toggle */}
        <div className="flex items-center gap-2">
          {mounted && (
            <button
              onClick={toggleTheme}
              disabled={isAnimating}
              aria-label={
                theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'
              }
              className="
                theme-toggle-btn touch-target
                relative flex items-center justify-center
                w-11 h-11 rounded-xl
                bg-zinc-100 dark:bg-zinc-800
                text-zinc-700 dark:text-zinc-200
                hover:bg-zinc-200 dark:hover:bg-zinc-700
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                dark:focus:ring-offset-zinc-900
                disabled:cursor-not-allowed disabled:opacity-50
              "
            >
              <span className="relative w-5 h-5">
                {/* Sun Icon - shown in dark mode */}
                <Sun
                  className={`
                    theme-icon absolute inset-0 w-5 h-5 text-amber-500
                    ${theme === 'dark' ? 'theme-icon-visible' : 'theme-icon-hidden'}
                  `}
                />
                {/* Moon Icon - shown in light mode */}
                <Moon
                  className={`
                    theme-icon absolute inset-0 w-5 h-5 text-slate-600
                    ${theme === 'light' ? 'theme-icon-visible' : 'theme-icon-hidden'}
                  `}
                />
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
