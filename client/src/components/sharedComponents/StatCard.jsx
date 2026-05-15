export default function StatCard({ label, value, sub, accent = "sky" }) {
  const accents = {
    sky: "text-sky-500",
    green: "text-green-500",
    red: "text-red-500",
    orange: "text-orange-500",
    violet: "text-violet-500",
    zinc: "text-zinc-500",
  };

  return (
    <div className="flex flex-col justify-between bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-lg shadow-sm p-4 min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 truncate">
        {label}
      </p>
      <p
        className={`mt-2 text-2xl font-bold ${
          accents[accent] || accents.sky
        }`}
      >
        {value}
      </p>
      {sub && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">
          {sub}
        </p>
      )}
    </div>
  );
}
