import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black px-4 py-8 sm:px-8 lg:px-16">
      <div className="mx-auto max-w-6xl space-y-16">

        {/* Navbar */}
        <header className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#5048e5] text-sm font-bold text-white shadow-lg shadow-[#5048e5]/30">AP</span>
            <span className="text-lg font-bold tracking-tight text-white">AutoPoster</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-[#5048e5] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#5048e5]/25 hover:bg-[#4338ca] transition-colors"
            >
              Get Started →
            </Link>
          </div>
        </header>

        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 px-8 py-20 text-center lg:py-28">
          <div className="pointer-events-none absolute inset-0 flex items-start justify-center">
            <div className="mt-[-60px] h-[400px] w-[700px] rounded-full bg-[#5048e5]/20 blur-[120px]" />
          </div>
          <div className="relative">
            <span className="inline-block rounded-full border border-[#5048e5]/40 bg-[#5048e5]/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-[#818cf8]">
              Personal AI Scheduler
            </span>
            <h1 className="mt-6 text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
              Post Smarter.<br />
              <span className="bg-gradient-to-r from-[#818cf8] to-[#5048e5] bg-clip-text text-transparent">
                Grow Faster.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-zinc-400 leading-relaxed">
              AutoPoster schedules and auto-publishes your LinkedIn and X content using browser automation.
              Write once, post everywhere — on your schedule, every week.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/login"
                className="rounded-xl bg-[#5048e5] px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#5048e5]/30 hover:bg-[#4338ca] transition-colors"
              >
                Start Posting →
              </Link>
              <Link
                href="/dashboard"
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-8 py-3.5 text-sm font-semibold text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors"
              >
                View Dashboard
              </Link>
            </div>
            {/* Social proof strip */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-600">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> LinkedIn automation
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> X / Twitter automation
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Weekly repeat scheduling
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Email notifications
              </span>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section>
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-black text-white">How it works</h2>
            <p className="mt-2 text-sm text-zinc-500">Three steps to fully automated social media</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Write your post",
                desc: "Use the editor to craft your content. Select LinkedIn, X, or both at once.",
              },
              {
                step: "02",
                title: "Set your schedule",
                desc: "Pick day, time, and whether to repeat weekly. Your posts live in the queue.",
              },
              {
                step: "03",
                title: "AutoPoster publishes",
                desc: "The worker runs every 5 min and publishes your posts right on time via browser automation.",
              },
            ].map((s) => (
              <div key={s.step} className="relative rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
                <span className="text-4xl font-black text-zinc-800">{s.step}</span>
                <h3 className="mt-3 text-base font-bold text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-zinc-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section>
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-black text-white">Everything you need</h2>
            <p className="mt-2 text-sm text-zinc-500">Built for personal social media automation</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: "🗓", title: "Smart Scheduling", desc: "Pick day and time. Posts repeat weekly automatically so you never miss a slot." },
              { icon: "🔗", title: "Multi-Platform", desc: "Write once and publish to LinkedIn and X simultaneously with a single click." },
              { icon: "⚡", title: "Publish Now", desc: "Skip the schedule — force any post live instantly without waiting for the cron." },
              { icon: "📊", title: "Analytics", desc: "Track posting volume, platform split, publish rate, and 14-day activity charts." },
              { icon: "📝", title: "Drafts", desc: "Save work-in-progress posts locally and come back to finish them later." },
              { icon: "📬", title: "Email Alerts", desc: "Get notified every time a post goes live or when your schedule is empty." },
            ].map((f) => (
              <article key={f.title} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 hover:border-zinc-600 transition-colors">
                <span className="text-3xl">{f.icon}</span>
                <h3 className="mt-4 text-base font-bold text-white">{f.title}</h3>
                <p className="mt-2 text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Platform support */}
        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[#0a66c2]/30 bg-[#0a66c2]/5 p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0a66c2] text-white font-bold text-sm">in</span>
              <h3 className="text-lg font-bold text-white">LinkedIn</h3>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Automates login, post creation, and publishing to your LinkedIn feed using Playwright. Session is saved so you only log in once.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-700 bg-zinc-950 p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 text-white font-bold text-sm">𝕏</span>
              <h3 className="text-lg font-bold text-white">X / Twitter</h3>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Automates login and tweet creation on X. Handles cookie consent, 2FA challenges, and session persistence across runs.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden rounded-3xl border border-[#5048e5]/30 bg-[#5048e5]/5 px-8 py-16 text-center">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[300px] w-[500px] rounded-full bg-[#5048e5]/15 blur-[100px]" />
          </div>
          <div className="relative">
            <h2 className="text-3xl font-black text-white">Ready to automate?</h2>
            <p className="mt-3 text-sm text-zinc-400">Sign in and start scheduling your content today.</p>
            <Link
              href="/login"
              className="mt-8 inline-block rounded-xl bg-[#5048e5] px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#5048e5]/30 hover:bg-[#4338ca] transition-colors"
            >
              Sign In to AutoPoster →
            </Link>
          </div>
        </section>

        {/* Quick nav */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-600">App Pages</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { href: "/dashboard", label: "Dashboard", sub: "Upcoming & published posts" },
              { href: "/create-post", label: "Create Post", sub: "Write and schedule content" },
              { href: "/calendar", label: "Calendar", sub: "Weekly schedule overview" },
              { href: "/analytics", label: "Analytics", sub: "Performance & trends" },
              { href: "/drafts", label: "Drafts", sub: "Saved but unscheduled ideas" },
              { href: "/settings", label: "Settings", sub: "Account & connections" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-4 hover:border-[#5048e5]/50 hover:bg-[#5048e5]/5 transition-all"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <p className="text-xs text-zinc-600 mt-0.5">{item.sub}</p>
                </div>
                <span className="text-zinc-700 group-hover:text-[#818cf8] transition-colors">→</span>
              </Link>
            ))}
          </div>
        </section>

        <footer className="flex items-center justify-between border-t border-zinc-900 pt-6 pb-4 text-xs text-zinc-700">
          <span>AutoPoster — personal social media automation</span>
          <Link href="/login" className="hover:text-zinc-500 transition-colors">Sign In</Link>
        </footer>
      </div>
    </main>
  );
}
