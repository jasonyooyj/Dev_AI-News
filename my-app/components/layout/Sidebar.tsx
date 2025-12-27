'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Database,
  Rss,
  Link2,
  ChevronRight,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Source } from '@/types/news';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  sources?: Source[];
  onAddSource?: () => void;
  onRefreshSources?: () => void;
  isRefreshing?: boolean;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: 'Sources',
    href: '/sources',
    icon: <Database className="w-5 h-5" />,
  },
];

export function Sidebar({
  isOpen,
  onClose,
  sources = [],
  onAddSource,
  onRefreshSources,
  isRefreshing = false,
}: SidebarProps) {
  const pathname = usePathname();
  const [isSourcesExpanded, setIsSourcesExpanded] = useState(true);

  const activeSources = sources.filter((s) => s.isActive);

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-40 lg:z-30
          h-screen lg:h-[calc(100vh-4rem)]
          w-72 lg:w-64
          bg-white dark:bg-zinc-950
          border-r border-zinc-200 dark:border-zinc-800
          transform transition-transform duration-300 ease-in-out
          lg:transform-none lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          overflow-y-auto
          flex flex-col
        `}
      >
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <div className="md:hidden mb-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                    transition-all duration-150
                    ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }
                  `}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="mb-6">
            <h3 className="px-3 mb-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Quick Actions
            </h3>
            <div className="space-y-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefreshSources}
                disabled={isRefreshing}
                isLoading={isRefreshing}
                className="w-full justify-start gap-3 px-3"
                leftIcon={!isRefreshing && <RefreshCw className="w-4 h-4" />}
              >
                Fetch All Sources
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onAddSource}
                className="w-full justify-start gap-3 px-3"
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add New Source
              </Button>
            </div>
          </div>

          {/* Sources List */}
          <div>
            <button
              onClick={() => setIsSourcesExpanded(!isSourcesExpanded)}
              className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
            >
              <span>Sources ({activeSources.length})</span>
              <ChevronRight
                className={`w-4 h-4 transition-transform duration-200 ${
                  isSourcesExpanded ? 'rotate-90' : ''
                }`}
              />
            </button>

            {isSourcesExpanded && (
              <div className="mt-1 space-y-0.5">
                {sources.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-zinc-400 dark:text-zinc-500">
                    No sources yet
                  </p>
                ) : (
                  sources.map((source) => (
                    <div
                      key={source.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      {source.rssUrl ? (
                        <Rss className="w-4 h-4 text-orange-500 flex-shrink-0" />
                      ) : (
                        <Link2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      )}
                      <span
                        className={`flex-1 truncate ${
                          source.isActive
                            ? 'text-zinc-700 dark:text-zinc-300'
                            : 'text-zinc-400 dark:text-zinc-600'
                        }`}
                      >
                        {source.name}
                      </span>
                      {!source.isActive && (
                        <Badge variant="default" size="sm">
                          Off
                        </Badge>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center">
            AI News Dashboard v1.0
          </p>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
