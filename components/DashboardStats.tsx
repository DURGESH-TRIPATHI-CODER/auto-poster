"use client";

import { useEffect, useRef, useState } from "react";

interface Stats {
  scheduled: number;
  published: number;
}

export function DashboardStats({ initial }: { initial: Stats }) {
  const [stats, setStats] = useState(initial);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  async function fetchStats() {
    try {
      const [sRes, pRes] = await Promise.all([
        fetch("/api/posts?published=false", { cache: "no-store" }),
        fetch("/api/posts?published=true", { cache: "no-store" }),
      ]);
      if (!sRes.ok || !pRes.ok) return;
      const [sData, pData] = await Promise.all([sRes.json(), pRes.json()]);
      setStats({
        scheduled: (sData.posts ?? []).length,
        published: (pData.posts ?? []).length,
      });
    } catch {}
  }

  useEffect(() => {
    fetchStats();
    intervalRef.current = setInterval(fetchStats, 15_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const total = stats.scheduled + stats.published;
  const publishRate = total === 0 ? 0 : Math.round((stats.published / total) * 100);

  const cards = [
    {
      label: "Scheduled",
      value: stats.scheduled,
      sub: "pending posts",
      color: "text-[#818cf8]",
      bg: "bg-[#5048e5]/10",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      ),
    },
    {
      label: "Published",
      value: stats.published,
      sub: "posts live",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
    {
      label: "Publish Rate",
      value: `${publishRate}%`,
      sub: `${stats.published} of ${total} total`,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19h16" />
          <rect x="6" y="11" width="3" height="6" rx="1" />
          <rect x="11" y="8" width="3" height="9" rx="1" />
          <rect x="16" y="5" width="3" height="12" rx="1" />
        </svg>
      ),
    },
  ];

  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-3">
      {cards.map((c) => (
        <section key={c.label} className="card p-5 flex items-center gap-4">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${c.bg} ${c.color}`}>
            {c.icon}
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{c.label}</p>
            <p className="mt-0.5 text-2xl font-bold text-white">{c.value}</p>
            <p className="text-xs text-zinc-600">{c.sub}</p>
          </div>
        </section>
      ))}
    </div>
  );
}
