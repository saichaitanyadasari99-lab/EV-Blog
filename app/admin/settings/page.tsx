import { requireAdminUser } from "@/lib/auth";

export default async function AdminSettingsPage() {
  await requireAdminUser();

  return (
    <section className="panel p-6">
      <h1 className="text-2xl font-black">Settings</h1>
      <p className="mt-2 text-sm text-[var(--ink-soft)]">
        Global controls for homepage behavior and publishing defaults.
      </p>

      <div className="mt-5 space-y-3">
        {[
          "Enable breaking ticker",
          "Show featured hero block",
          "Auto-set latest post as hero",
          "Allow comments (future)",
        ].map((item) => (
          <label
            key={item}
            className="flex items-center justify-between rounded-xl border border-[var(--border)] p-4"
          >
            <span className="font-semibold">{item}</span>
            <input type="checkbox" defaultChecked className="h-4 w-4" />
          </label>
        ))}
      </div>
    </section>
  );
}
