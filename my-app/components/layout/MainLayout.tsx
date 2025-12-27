'use client';

import { useState, ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Source } from '@/types/news';

interface MainLayoutProps {
  children: ReactNode;
  sources?: Source[];
  onAddSource?: () => void;
  onRefreshSources?: () => void;
  isRefreshing?: boolean;
}

export function MainLayout({
  children,
  sources = [],
  onAddSource,
  onRefreshSources,
  isRefreshing = false,
}: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header onMenuClick={toggleSidebar} isSidebarOpen={isSidebarOpen} />

      <div className="flex">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
          sources={sources}
          onAddSource={onAddSource}
          onRefreshSources={onRefreshSources}
          isRefreshing={isRefreshing}
        />

        <main className="flex-1 min-h-[calc(100vh-4rem)] overflow-x-hidden">
          <div className="container mx-auto px-4 md:px-6 py-6 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
