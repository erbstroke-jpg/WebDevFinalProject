'use client';

export function ChatListSkeleton() {
  return (
    <div className="flex flex-col">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
            <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}