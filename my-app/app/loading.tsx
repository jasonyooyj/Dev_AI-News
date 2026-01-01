import { DashboardSkeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header Skeleton */}
      <header className="h-16 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <div className="h-8 w-32 bg-muted/60 rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="h-8 w-8 bg-muted/60 rounded animate-pulse" />
            <div className="h-8 w-8 bg-muted/60 rounded animate-pulse" />
          </div>
        </div>
      </header>

      {/* Main Content Skeleton */}
      <div className="flex">
        <main className="flex-1 min-h-[calc(100vh-4rem)]">
          <div className="container mx-auto px-3 sm:px-4 md:px-6 py-6 max-w-7xl">
            <DashboardSkeleton />
          </div>
        </main>
      </div>
    </div>
  );
}
