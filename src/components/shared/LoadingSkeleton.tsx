// FILE: src/components/shared/LoadingSkeleton.tsx
// STAGE: 7
// UPDATED: 2026-10-02
import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export interface LoadingSkeletonProps {
  rows?: number;
}

export function LoadingSkeleton({ rows = 5 }: LoadingSkeletonProps) {
  return (
    <div className="w-full space-y-3">
      {/* Table Header skeleton */}
      <div className="flex items-center space-x-4 border-b pb-3">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>

      {/* Table Body rows */}
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4 py-2 border-b/50">
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-5 w-1/4" />
        </div>
      ))}
    </div>
  );
}
