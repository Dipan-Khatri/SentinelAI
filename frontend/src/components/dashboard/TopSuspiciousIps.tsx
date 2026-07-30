import {
  Activity,
  Network,
  ShieldAlert,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { UploadResult } from "../../services/api";

type SuspiciousIp =
  UploadResult["suspicious_ips"][number];

type TopSuspiciousIpsProps = {
  suspiciousIps: SuspiciousIp[];
};

type ChartItem = {
  ip: string;
  attempts: number;
  rank: number;
  color: string;
};

type TooltipPayloadItem = {
  payload?: ChartItem;
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadItem[];
};

const BAR_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#3b82f6",
  "#8b5cf6",
];

function CustomTooltip({
  active,
  payload,
}: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const item = payload[0].payload;

  if (!item) {
    return null;
  }

  return (
    <div className="rounded-lg border border-slate-600 bg-slate-950 px-4 py-3 shadow-xl">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-red-400" />

        <p className="font-semibold text-white">
          Suspicious IP
        </p>
      </div>

      <p className="mt-2 font-mono text-sm text-blue-300">
        {item.ip}
      </p>

      <div className="mt-3 flex items-center justify-between gap-6 text-sm">
        <span className="text-slate-400">
          Failed attempts
        </span>

        <span className="font-bold text-white">
          {item.attempts.toLocaleString()}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between gap-6 text-sm">
        <span className="text-slate-400">
          Threat rank
        </span>

        <span className="font-bold text-orange-300">
          #{item.rank}
        </span>
      </div>
    </div>
  );
}

function TopSuspiciousIps({
  suspiciousIps,
}: TopSuspiciousIpsProps) {
  const sortedIps = [...suspiciousIps]
    .sort(
      (firstIp, secondIp) =>
        secondIp.attempts - firstIp.attempts,
    )
    .slice(0, 5);

  const chartData: ChartItem[] = sortedIps.map(
    (item, index) => ({
      ip: item.ip,
      attempts: item.attempts,
      rank: index + 1,
      color:
        BAR_COLORS[index] ??
        BAR_COLORS[BAR_COLORS.length - 1],
    }),
  );

  const totalAttempts = chartData.reduce(
    (total, item) => total + item.attempts,
    0,
  );

  const highestAttempts =
    chartData.length > 0
      ? Math.max(
          ...chartData.map((item) => item.attempts),
        )
      : 0;

  return (
    <section className="flex h-full flex-col rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Top Suspicious IPs
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Sources producing repeated failed
            authentication attempts.
          </p>
        </div>

        <div className="rounded-lg bg-orange-500/15 p-3">
          <Network className="h-7 w-7 text-orange-400" />
        </div>
      </div>

      {chartData.length > 0 ? (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-700 bg-slate-950/40 p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-orange-400" />

                <p className="text-sm text-slate-400">
                  Total Attempts
                </p>
              </div>

              <p className="mt-2 text-2xl font-bold text-white">
                {totalAttempts.toLocaleString()}
              </p>
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-950/40 p-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-red-400" />

                <p className="text-sm text-slate-400">
                  Highest Source
                </p>
              </div>

              <p className="mt-2 text-2xl font-bold text-white">
                {highestAttempts.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="mt-6 h-80 w-full">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{
                  top: 5,
                  right: 38,
                  bottom: 5,
                  left: 10,
                }}
              >
                <CartesianGrid
                  stroke="#334155"
                  strokeDasharray="4 4"
                  horizontal={false}
                />

                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{
                    fill: "#94a3b8",
                    fontSize: 12,
                  }}
                  axisLine={{
                    stroke: "#475569",
                  }}
                  tickLine={false}
                />

                <YAxis
                  type="category"
                  dataKey="ip"
                  width={112}
                  tick={{
                    fill: "#cbd5e1",
                    fontSize: 12,
                    fontFamily: "monospace",
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  cursor={{
                    fill: "rgba(51, 65, 85, 0.25)",
                  }}
                  content={<CustomTooltip />}
                />

                <Bar
                  dataKey="attempts"
                  radius={[0, 7, 7, 0]}
                  barSize={28}
                  isAnimationActive
                  animationDuration={800}
                >
                  {chartData.map((item) => (
                    <Cell
                      key={item.ip}
                      fill={item.color}
                    />
                  ))}

                  <LabelList
                    dataKey="attempts"
                    position="right"
                    fill="#e2e8f0"
                    fontSize={12}
                    fontWeight={700}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-auto border-t border-slate-700 pt-4">
            <p className="text-xs leading-5 text-slate-500">
              Hover over a bar to view the source IP,
              attempt count, and threat rank.
            </p>
          </div>
        </>
      ) : (
        <div className="mt-6 flex min-h-80 flex-1 flex-col items-center justify-center rounded-lg border border-green-500/30 bg-green-500/10 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15">
            <Network className="h-8 w-8 text-green-400" />
          </div>

          <h3 className="mt-5 text-lg font-semibold text-green-300">
            No suspicious IPs detected
          </h3>

          <p className="mt-2 max-w-sm text-sm leading-6 text-green-400">
            The latest analysis did not identify any
            sources with repeated failed authentication
            attempts.
          </p>
        </div>
      )}
    </section>
  );
}

export default TopSuspiciousIps; 
