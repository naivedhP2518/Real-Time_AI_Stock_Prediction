/**
 * @file LoadingSkeleton.jsx
 * @description Reusable skeleton loading components with animated shimmer effect.
 *              Use during data fetch states to prevent layout shift and improve UX.
 */

import React from 'react';

// ─── Base Skeleton Block ──────────────────────────────────────────────────────
export const SkeletonBlock = ({ className = '', rounded = 'rounded-lg' }) => (
  <div
    className={`animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200
                dark:from-slate-700 dark:via-slate-600 dark:to-slate-700
                bg-[length:200%_100%] ${rounded} ${className}`}
    style={{ animation: 'shimmer 1.5s infinite linear' }}
  />
);

// ─── Stat Card Skeleton ───────────────────────────────────────────────────────
export const StatCardSkeleton = () => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <SkeletonBlock className="h-4 w-24" />
      <SkeletonBlock className="h-8 w-8" rounded="rounded-full" />
    </div>
    <SkeletonBlock className="h-8 w-32 mb-2" />
    <SkeletonBlock className="h-3 w-20" />
  </div>
);

// ─── Chart Skeleton ───────────────────────────────────────────────────────────
export const ChartSkeleton = ({ height = 'h-64' }) => (
  <div className={`bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm ${height}`}>
    <div className="flex items-center justify-between mb-4">
      <SkeletonBlock className="h-5 w-36" />
      <div className="flex gap-2">
        <SkeletonBlock className="h-7 w-16" rounded="rounded-full" />
        <SkeletonBlock className="h-7 w-16" rounded="rounded-full" />
      </div>
    </div>
    <SkeletonBlock className="h-full w-full" rounded="rounded-xl" />
  </div>
);

// ─── Table Row Skeleton ───────────────────────────────────────────────────────
export const TableRowSkeleton = ({ cols = 5 }) => (
  <tr className="border-b border-slate-100 dark:border-slate-700">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="py-3 px-4">
        <SkeletonBlock className={`h-4 ${i === 0 ? 'w-24' : i === 1 ? 'w-16' : 'w-20'}`} />
      </td>
    ))}
  </tr>
);

// ─── Stock Card Skeleton ──────────────────────────────────────────────────────
export const StockCardSkeleton = () => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
    <div className="flex items-center justify-between mb-3">
      <div>
        <SkeletonBlock className="h-5 w-16 mb-1" />
        <SkeletonBlock className="h-3 w-28" />
      </div>
      <SkeletonBlock className="h-10 w-10" rounded="rounded-full" />
    </div>
    <SkeletonBlock className="h-7 w-24 mb-2" />
    <div className="flex items-center gap-2">
      <SkeletonBlock className="h-5 w-16" rounded="rounded-full" />
      <SkeletonBlock className="h-3 w-12" />
    </div>
    <SkeletonBlock className="h-12 w-full mt-3" rounded="rounded-xl" />
  </div>
);

// ─── Dashboard Grid Skeleton ──────────────────────────────────────────────────
export const DashboardSkeleton = () => (
  <div className="space-y-6 animate-fade-in">
    {/* Stat cards row */}
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
    {/* Charts row */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartSkeleton height="h-72" />
      <ChartSkeleton height="h-72" />
    </div>
    {/* Stock cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <StockCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

// ─── Portfolio Skeleton ───────────────────────────────────────────────────────
export const PortfolioSkeleton = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
      <SkeletonBlock className="h-5 w-32 mb-4" />
      <table className="w-full">
        <tbody>
          {Array.from({ length: 6 }).map((_, i) => (
            <TableRowSkeleton key={i} cols={6} />
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ─── Prediction Skeleton ──────────────────────────────────────────────────────
export const PredictionSkeleton = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
        <SkeletonBlock className="h-5 w-40 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <SkeletonBlock className="h-4 w-24" />
              <SkeletonBlock className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
      <ChartSkeleton height="h-48" />
    </div>
    <ChartSkeleton height="h-64" />
  </div>
);

export default {
  SkeletonBlock,
  StatCardSkeleton,
  ChartSkeleton,
  TableRowSkeleton,
  StockCardSkeleton,
  DashboardSkeleton,
  PortfolioSkeleton,
  PredictionSkeleton,
};
