import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-brand-500">Phase 0</p>
        <h1 className="mt-3 text-3xl font-semibold">PTMS foundation is ready</h1>
        <p className="mt-3 max-w-2xl text-slate-400">
          This shell establishes the application structure, theme, navigation, and tooling for the
          next stages of development.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/trade-cases" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700">
            View Trade Cases
          </Link>
          <Link href="/settings" className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800">
            Open Settings
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="font-semibold">Core shell</h2>
          <p className="mt-2 text-sm text-slate-400">App layout, theme, and navigation structure are in place.</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="font-semibold">Tooling</h2>
          <p className="mt-2 text-sm text-slate-400">TypeScript, Tailwind, Prisma, and linting are configured.</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="font-semibold">Ready for modules</h2>
          <p className="mt-2 text-sm text-slate-400">The foundation is prepared for future trade-case features.</p>
        </div>
      </div>
    </div>
  );
}
