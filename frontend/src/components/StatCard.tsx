import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  title: string;
  value: number | string;
  accentClass: string;
  icon?: LucideIcon;
  subtitle?: string;
};

function StatCard({
  title,
  value,
  accentClass,
  icon: Icon,
  subtitle,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-5 shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">
            {title}
          </p>

          <p
            className={`mt-2 text-3xl font-bold ${accentClass}`}
          >
            {typeof value === "number"
              ? value.toLocaleString()
              : value}
          </p>
        </div>

        {Icon && (
          <div className="rounded-lg bg-slate-950/60 p-2.5">
            <Icon
              className={`h-5 w-5 ${accentClass}`}
            />
          </div>
        )}
      </div>

      {subtitle && (
        <p className="mt-3 text-xs leading-5 text-slate-500">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default StatCard;
