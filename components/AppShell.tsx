"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

type NavKey = "dashboard" | "create-post" | "calendar" | "analytics" | "drafts" | "settings";

const navItems: Array<{ key: NavKey; href: string; label: string }> = [
  { key: "dashboard", href: "/dashboard", label: "Dashboard" },
  { key: "create-post", href: "/create-post", label: "Create Post" },
  { key: "calendar", href: "/calendar", label: "Calendar" },
  { key: "analytics", href: "/analytics", label: "Analytics" },
  { key: "drafts", href: "/drafts", label: "Drafts" },
  { key: "settings", href: "/settings", label: "Settings" }
];

interface AppShellProps {
  active: NavKey;
  title: string;
  subtitle: string;
  children: ReactNode;
  action?: ReactNode;
}

export function AppShell({ active, title, subtitle, children, action }: AppShellProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hovered, setHovered] = useState<NavKey | null>(null);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  function renderIcon(key: NavKey) {
    switch (key) {
      case "dashboard":
        return (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="8" height="8" rx="1" />
            <rect x="13" y="3" width="8" height="5" rx="1" />
            <rect x="13" y="10" width="8" height="11" rx="1" />
            <rect x="3" y="13" width="8" height="8" rx="1" />
          </svg>
        );
      case "create-post":
        return (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
        );
      case "calendar":
        return (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
        );
      case "analytics":
        return (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19h16" />
            <rect x="6" y="11" width="3" height="6" rx="1" />
            <rect x="11" y="8" width="3" height="9" rx="1" />
            <rect x="16" y="5" width="3" height="12" rx="1" />
          </svg>
        );
      case "drafts":
        return (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4h16v16H4z" />
            <path d="M8 8h8M8 12h8M8 16h5" />
          </svg>
        );
      case "settings":
        return (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.1a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.1a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2H9a1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.1a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1V9c0 .4.2.7.6.9H20a2 2 0 1 1 0 4h-.1a1 1 0 0 0-.9.6Z" />
          </svg>
        );
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto flex min-h-screen max-w-[1400px]">
        <aside className={`flex flex-col overflow-hidden border-r border-zinc-800 bg-zinc-950 transition-all duration-300 ${sidebarOpen ? "w-64 p-4" : "w-0 p-0 border-r-0"}`}>
          <div className="mb-8 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white transition ${
                  hovered ? "bg-primary shadow-lg shadow-primary/20" : "bg-primary/90"
                }`}
              >
                NA
              </span>
              <span className="text-lg font-bold tracking-tight text-white">Narada</span>
            </Link>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="rounded-md p-2 text-zinc-400 hover:bg-zinc-800"
              aria-label="Collapse sidebar"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = item.key === active;
              return (
                <a
                  key={item.key}
                  href={item.href as string}
                  onMouseEnter={() => setHovered(item.key)}
                  onMouseLeave={() => setHovered(null)}
                  className={`block rounded-xl px-3 py-2 text-sm font-medium transition ${
                    isActive ? "bg-primary/20 text-primary" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {renderIcon(item.key)}
                    <span>{item.label}</span>
                  </span>
                </a>
              );
            })}
          </nav>

          <div className="mt-auto pt-8">
            <button
              onClick={logout}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-800 hover:text-red-400 transition"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </div>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-zinc-800 bg-black/95 px-4 py-4 backdrop-blur sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {!sidebarOpen ? (
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(true)}
                    className="rounded-md border border-zinc-700 p-2 text-zinc-400 hover:bg-zinc-800"
                    aria-label="Open sidebar"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                ) : null}
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
                  <p className="text-sm text-zinc-500">{subtitle}</p>
                </div>
              </div>
              <div>{action}</div>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
