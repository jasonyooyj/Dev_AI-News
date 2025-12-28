'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Newspaper,
  LayoutDashboard,
  Database,
  Sun,
  Moon,
  Menu,
  X,
  User,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthContext } from '@/components/auth/AuthProvider';

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
  const router = useRouter();
  const { user, profile, signOut, loading: authLoading } = useAuthContext();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsUserMenuOpen(false);
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

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

  const toggleTheme = useCallback(() => {
    if (isAnimating) return;

    setIsAnimating(true);

    // Add theme-transition class for smooth color transitions
    document.documentElement.classList.add('theme-transition');

    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');

    // Remove transition class after animation completes
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transition');
      setIsAnimating(false);
    }, 200);
  }, [theme, isAnimating]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-3 sm:px-4 md:px-6">
        {/* Left: Logo and Mobile Menu */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden"
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

        {/* Right: Theme Toggle & User Menu */}
        <div className="flex items-center gap-2">
          {mounted && (
            <button
              onClick={toggleTheme}
              disabled={isAnimating}
              aria-label={
                theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'
              }
              className="
                theme-toggle-btn
                relative flex items-center justify-center
                w-10 h-10 rounded-xl
                bg-zinc-100 dark:bg-zinc-800
                text-zinc-700 dark:text-zinc-200
                hover:bg-zinc-200 dark:hover:bg-zinc-700
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                dark:focus:ring-offset-zinc-900
                disabled:cursor-not-allowed
              "
            >
              <span className="relative w-5 h-5">
                {/* Sun Icon */}
                <Sun
                  className={`
                    absolute inset-0 w-5 h-5
                    ${theme === 'dark' ? 'theme-icon-enter' : 'opacity-0 scale-50'}
                  `}
                />
                {/* Moon Icon */}
                <Moon
                  className={`
                    absolute inset-0 w-5 h-5
                    ${theme === 'light' ? 'theme-icon-enter' : 'opacity-0 scale-50'}
                  `}
                />
              </span>
            </button>
          )}

          {/* User Menu */}
          {mounted && !authLoading && user && (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={profile?.displayName || 'User'}
                    className="w-7 h-7 rounded-full"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                    {(profile?.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:block text-sm font-medium text-zinc-700 dark:text-zinc-300 max-w-[100px] truncate">
                  {profile?.displayName || user.email?.split('@')[0]}
                </span>
                <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 py-1 z-50">
                  <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {profile?.displayName || 'User'}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                      {user.email}
                    </p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Login Button (when not authenticated) */}
          {mounted && !authLoading && !user && (
            <Link
              href="/login"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
