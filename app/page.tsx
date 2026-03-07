import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8 lg:px-16">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">AP</span>
            <span className="text-lg font-bold">AutoPoster</span>
          </div>
          <Link href="/dashboard" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90">
            Open App
          </Link>
        </header>

        <section className="grid gap-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm lg:grid-cols-2 lg:p-12">
          <div>
            <p className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">AI Assistant</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">Automate Your Social Presence</h1>
            <p className="mt-4 max-w-xl text-slate-600">
              Plan, create, schedule, and analyze LinkedIn and X posts in one workflow. Design and features now aligned for Landing, Dashboard,
              Create Post, Calendar, Analytics, and Settings.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/dashboard" className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90">
                Open Dashboard
              </Link>
              <Link href="/create-post" className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                Create Post
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/dashboard" className="card p-4 text-sm font-semibold">Dashboard</Link>
            <a href="/calendar" className="card p-4 text-sm font-semibold">Calendar</a>
            <Link href="/create-post" className="card p-4 text-sm font-semibold">Create Post</Link>
            <a href="/analytics" className="card p-4 text-sm font-semibold">Analytics</a>
            <a href="/settings" className="card col-span-2 p-4 text-sm font-semibold">Settings</a>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="card p-5">
            <h2 className="text-lg font-bold">Scheduling</h2>
            <p className="mt-2 text-sm text-slate-600">Weekly slot management with platform-specific queues.</p>
          </article>
          <article className="card p-5">
            <h2 className="text-lg font-bold">Multi-platform</h2>
            <p className="mt-2 text-sm text-slate-600">Post to LinkedIn and X from one editor.</p>
          </article>
          <article className="card p-5">
            <h2 className="text-lg font-bold">Analytics</h2>
            <p className="mt-2 text-sm text-slate-600">Track volume, platform split, and recent performance.</p>
          </article>
          <article className="card p-5">
            <h2 className="text-lg font-bold">Settings</h2>
            <p className="mt-2 text-sm text-slate-600">Account profile, social connections, and notifications.</p>
          </article>
        </section>
      </div>
    </main>
  );
}
