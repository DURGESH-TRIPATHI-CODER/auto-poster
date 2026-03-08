import { AppShell } from "@/components/AppShell";

export default function SettingsPage() {
  return (
    <AppShell active="settings" title="Settings" subtitle="Manage profile, social connections, and notifications.">
      <section className="card overflow-hidden">
        <div className="border-b border-slate-200 p-6">
          <h2 className="text-lg font-semibold">Account Profile</h2>
          <p className="text-sm text-slate-500">Update your identity details and contact information.</p>
        </div>
        <div className="grid gap-4 p-6 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Full Name</span>
            <input defaultValue="Alex Smith" className="w-full rounded-lg border border-slate-200 p-2.5 text-sm" />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email</span>
            <input defaultValue="alex@example.com" className="w-full rounded-lg border border-slate-200 p-2.5 text-sm" />
          </label>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <article className="card p-6">
          <h3 className="text-lg font-semibold">LinkedIn</h3>
          <p className="mt-2 text-sm text-emerald-600">Connected as Alex Smith</p>
          <button className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium">Manage Profile</button>
        </article>
        <article className="card p-6">
          <h3 className="text-lg font-semibold">X (Twitter)</h3>
          <p className="mt-2 text-sm text-slate-500">Disconnected</p>
          <button className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">Connect Account</button>
        </article>
      </section>

      <section className="card mt-6 overflow-hidden">
        <div className="border-b border-slate-200 p-6">
          <h2 className="text-lg font-semibold">Email Notifications</h2>
          <p className="text-sm text-slate-500">Control alerts and reports from Narada.</p>
        </div>
        <div className="space-y-4 p-6">
          <label className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
            <span className="text-sm font-medium">Post reminders</span>
            <input type="checkbox" defaultChecked />
          </label>
          <label className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
            <span className="text-sm font-medium">Weekly performance reports</span>
            <input type="checkbox" />
          </label>
          <label className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
            <span className="text-sm font-medium">Security alerts</span>
            <input type="checkbox" defaultChecked />
          </label>
        </div>
      </section>
    </AppShell>
  );
}
