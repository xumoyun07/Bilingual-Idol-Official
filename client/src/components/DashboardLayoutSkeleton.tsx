import React from "react";

export function DashboardLayoutSkeleton() {
  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      
      {/* Sidebar Skeleton (Desktop only) */}
      <div className="hidden md:flex flex-col w-64 h-full border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4 space-y-6 shrink-0 animate-pulse">
        {/* Brand/Logo Placeholder */}
        <div className="flex items-center gap-3 px-2 py-1.5">
          <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-1.5 flex-1">
            <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="h-3 w-16 bg-slate-200/60 dark:bg-slate-800/60 rounded-md" />
          </div>
        </div>

        {/* Navigation List Placeholders */}
        <div className="space-y-3 flex-1 pt-4">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
              <div className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md flex-1" style={{ maxWidth: `${Math.floor(Math.random() * 40) + 50}%` }} />
            </div>
          ))}
        </div>

        {/* Footer/Profile Placeholder */}
        <div className="flex items-center gap-3 border-t border-slate-200 dark:border-slate-800 pt-4 px-2">
          <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="h-2.5 w-16 bg-slate-200/60 dark:bg-slate-800/60 rounded-md" />
          </div>
        </div>
      </div>

      {/* Main Content Area Skeleton */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header Skeleton */}
        <div className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-between px-6 animate-pulse">
          <div className="flex items-center gap-4">
            {/* Sidebar toggle button placeholder for mobile */}
            <div className="w-7 h-7 md:hidden rounded-md bg-slate-100 dark:bg-slate-900" />
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>

        {/* Body Container Skeleton */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-slate-950/40 animate-pulse">
          
          {/* Top Banner/Header */}
          <div className="space-y-2 max-w-xl">
            <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="h-4 w-96 bg-slate-200/80 dark:bg-slate-800/80 rounded-md" />
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            {[...Array(3)].map((_, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-5 space-y-4 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
                  <div className="w-12 h-5 rounded-full bg-slate-100 dark:bg-slate-800" />
                </div>
                <div className="space-y-2">
                  <div className="h-5 w-36 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  <div className="h-3.5 w-full bg-slate-100 dark:bg-slate-800/60 rounded-md" />
                  <div className="h-3.5 w-5/6 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
                </div>
              </div>
            ))}
          </div>

          {/* Large Table/List Panel Skeleton */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded-md" />
              <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
            </div>
            <div className="space-y-3.5 pt-2">
              {[...Array(4)].map((_, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0 dark:border-slate-900/60">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 rounded-full bg-slate-150 dark:bg-slate-850" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3.5 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
                      <div className="h-2.5 w-24 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
                    </div>
                  </div>
                  <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-md" />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

export default DashboardLayoutSkeleton;
