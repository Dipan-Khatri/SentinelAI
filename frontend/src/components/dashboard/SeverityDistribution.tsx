import { BarChart3 } from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import type { UploadResult } from "../../services/api";

type SeverityDistributionProps = {
  analysis: UploadResult;
};

type SeverityItem = {
  name: string;
  value: number;
  color: string;
  textClass: string;
  backgroundClass: string;
};

type TooltipPayloadItem = {
  name?: string;
  value?: number;
  payload?: SeverityItem;
};

type SeverityTooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadItem[];
};

function SeverityTooltip({
  active,
  payload,
}: SeverityTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const severity = payload[0].payload;

  if (!severity) {
    return null;
  }

  return (
    <div className="rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 shadow-xl">
      <div className="flex items-center gap-2">
        <span
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: severity.color }}
        />

        <p className="font-semibold text-white">
          {severity.name}
        </p>
      </div>

      <p className="mt-2 text-sm text-slate-300">
        Alerts:{" "}
        <span className="font-bold text-white">
          {severity.value.toLocaleString()}
        </span>
      </p>
    </div>
  );
}

function SeverityDistribution({
  analysis,
}: SeverityDistributionProps) {
  const severityData: SeverityItem[] = [
    {
      name: "Critical",
      value: analysis.severity_summary.critical,
      color: "#ef4444",
      textClass: "text-red-300",
      backgroundClass: "bg-red-500/10",
    },
    {
      name: "High",
      value: analysis.severity_summary.high,
      color: "#f97316",
      textClass: "text-orange-300",
      backgroundClass: "bg-orange-500/10",
    },
    {
      name: "Medium",
      value: analysis.severity_summary.medium,
      color: "#f59e0b",
      textClass: "text-amber-300",
      backgroundClass: "bg-amber-500/10",
    },
    {
      name: "Low",
      value: analysis.severity_summary.low,
      color: "#22c55e",
      textClass: "text-green-300",
      backgroundClass: "bg-green-500/10",
    },
  ];

  const totalAlerts = severityData.reduce(
    (total, severity) => total + severity.value,
    0,
  );

  const chartData = severityData.filter(
    (severity) => severity.value > 0,
  );

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-lg">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Severity Distribution
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Interactive alert breakdown from the latest
            security analysis.
          </p>
        </div>

        <div className="rounded-lg bg-blue-500/15 p-3">
          <BarChart3 className="h-7 w-7 text-blue-400" />
        </div>
      </div>

      {totalAlerts > 0 ? (
        <>
          <div className="relative mt-6 h-72 w-full">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={72}
                  outerRadius={108}
                  paddingAngle={4}
                  stroke="#1e293b"
                  strokeWidth={3}
                  isAnimationActive
                >
                  {chartData.map((severity) => (
                    <Cell
                      key={severity.name}
                      fill={severity.color}
                    />
                  ))}
                </Pie>

                <Tooltip
                  content={<SeverityTooltip />}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-sm font-medium text-slate-400">
                Total Alerts
              </p>

              <p className="mt-1 text-4xl font-bold text-white">
                {totalAlerts.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            {severityData.map((severity) => {
              const percentage = Math.round(
                (severity.value / totalAlerts) * 100,
              );

              return (
                <div
                  key={severity.name}
                  className={`rounded-lg border border-slate-700 p-3 ${severity.backgroundClass}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor: severity.color,
                        }}
                      />

                      <p className="text-sm font-medium text-slate-300">
                        {severity.name}
                      </p>
                    </div>

                    <span className="text-xs text-slate-400">
                      {percentage}%
                    </span>
                  </div>

                  <p
                    className={`mt-2 text-2xl font-bold ${severity.textClass}`}
                  >
                    {severity.value.toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="mt-6 flex min-h-72 flex-col items-center justify-center rounded-lg border border-green-500/30 bg-green-500/10 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15">
            <BarChart3 className="h-8 w-8 text-green-400" />
          </div>

          <p className="mt-5 text-lg font-semibold text-green-300">
            No alerts detected
          </p>

          <p className="mt-2 max-w-sm text-sm leading-6 text-green-400">
            The latest analysis did not produce any critical,
            high, medium, or low severity alerts.
          </p>
        </div>
      )}
    </section>
  );
}

export default SeverityDistribution; 