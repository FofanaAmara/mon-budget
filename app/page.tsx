// Dashboard — skeleton placeholder (replaced in Phase C with real widgets)
export default function DashboardPage() {
  return (
    <div className="px-4 pt-8 pb-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest mb-1">Février 2026</p>
          <h1 className="text-2xl font-bold text-[#1E293B]">Mon Budget</h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-[#2563EB] flex items-center justify-center">
          <span className="text-white font-bold text-sm">MB</span>
        </div>
      </div>

      {/* Total card skeleton */}
      <div className="bg-[#2563EB] rounded-3xl p-6 text-white">
        <p className="text-sm opacity-75 mb-1">Total mensuel</p>
        <div className="h-9 bg-white/20 rounded-xl w-48 animate-pulse" />
        <div className="h-4 bg-white/10 rounded-lg w-32 mt-2 animate-pulse" />
      </div>

      {/* Widget skeletons */}
      {[
        { title: 'Par section', height: 'h-32' },
        { title: 'Prochaines (7j)', height: 'h-24' },
        { title: 'Alertes', height: 'h-16' },
      ].map((w) => (
        <div key={w.title} className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
          <div className="h-4 bg-[#F1F5F9] rounded w-28 mb-3 animate-pulse" />
          <div className={`${w.height} bg-[#F8FAFC] rounded-xl animate-pulse`} />
        </div>
      ))}
    </div>
  );
}
