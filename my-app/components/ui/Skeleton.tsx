'use client';

import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  shimmer?: boolean;
}

export function Skeleton({ className, shimmer = true }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted/60",
        shimmer && "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        !shimmer && "animate-pulse",
        className
      )}
    />
  );
}

// Animation variants for staggered skeleton
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 25,
    },
  },
};

// Stats Card Skeleton
export function StatsCardSkeleton() {
  return (
    <motion.div
      variants={itemVariants}
      className="bg-card rounded-lg border border-border p-4"
    >
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-4 w-24" />
    </motion.div>
  );
}

// News Card Skeleton
export function NewsCardSkeleton() {
  return (
    <motion.div
      variants={itemVariants}
      className="bg-card rounded-lg border border-border p-4 space-y-3"
    >
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-16 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </motion.div>
  );
}

// News List Skeleton with staggered animation
export function NewsListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
    >
      {Array.from({ length: count }).map((_, i) => (
        <NewsCardSkeleton key={i} />
      ))}
    </motion.div>
  );
}

// Stats Row Skeleton with staggered animation
export function StatsRowSkeleton() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <StatsCardSkeleton key={i} />
      ))}
    </motion.div>
  );
}

// Tab Navigation Skeleton
export function TabNavigationSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="flex gap-2 border-b border-border pb-2"
    >
      <Skeleton className="h-9 w-24" />
      <Skeleton className="h-9 w-28" />
    </motion.div>
  );
}

// Full Dashboard Skeleton
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <StatsRowSkeleton />
      <TabNavigationSkeleton />
      <NewsListSkeleton count={6} />
    </div>
  );
}
