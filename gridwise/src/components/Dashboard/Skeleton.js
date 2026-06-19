"use client";

// Pulse skeleton block
export function SkeletonBlock({ className = "" }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className}`} />;
}

// 4 KPI cards skeleton
export function KPISkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
          <SkeletonBlock className="h-3 w-24 mb-4" />
          <SkeletonBlock className="h-7 w-32" />
        </div>
      ))}
    </div>
  );
}

// Chart skeleton
export function ChartSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm min-h-[320px]">
      <SkeletonBlock className="h-4 w-40 mb-6" />
      <div className="flex items-end gap-2 h-48">
        {[60, 80, 50, 90, 70, 85, 55, 75, 65, 95, 45, 80].map((h, i) => (
          <div key={i} className="flex-1 animate-pulse bg-slate-200 rounded-t-md" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

// Insights skeleton
export function InsightsSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <SkeletonBlock className="h-4 w-32 mb-6" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex gap-3 mb-4">
          <SkeletonBlock className="h-4 w-4 shrink-0 mt-0.5" />
          <SkeletonBlock className={`h-4 ${i % 2 === 0 ? "w-full" : "w-4/5"}`} />
        </div>
      ))}
    </div>
  );
}

// Recommendations skeleton
export function RecommendationsSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <SkeletonBlock className="h-4 w-48 mb-6" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex gap-4 mb-5">
          <SkeletonBlock className="h-10 w-10 shrink-0 rounded-xl" />
          <div className="flex-1">
            <SkeletonBlock className="h-4 w-3/4 mb-2" />
            <SkeletonBlock className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Error state
export function ErrorState({ message = "Could not load data. Please try again later." }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-center gap-4">
      <span className="material-symbols-outlined text-red-400 text-3xl shrink-0">wifi_off</span>
      <div>
        <p className="font-semibold text-red-600 text-sm">API Unavailable</p>
        <p className="text-red-400 text-xs mt-0.5">{message}</p>
      </div>
    </div>
  );
}
