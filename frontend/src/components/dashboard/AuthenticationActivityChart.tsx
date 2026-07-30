import {
  Activity,
  CheckCircle2,
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

type AuthenticationActivityChartProps = {
  analysis: UploadResult;
};

type AuthenticationChartItem = {
  name: string;
  value: number;
  color: string;
  description: string;
};

type TooltipPayloadItem = {
  payload?: AuthenticationChartItem;
};

type AuthenticationTooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadItem[];
};

function AuthenticationTooltip({
  active,
  payload,
}: AuthenticationTooltipProps) {
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
        <span
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: item.color }}
        />

        <p className="font-semibold text-white">
          {item.name}
        </p>
      </div>

      <p className="mt-2 text-sm text-slate-400">
        {item.description}
      </p>

      <p className="mt-3 text-sm text-slate-300">
        Events:{" "}
        <span className="font-bold text-white">
          {item.value.toLocaleString()}
        </span>
      </p>
    </div>
  );
}

function AuthenticationActivityChart({
  analysis,
}: AuthenticationActivityChartProps) {
  const successfulLogins = Math.max(
    analysis.successful_logins,
    0,
  );

  const failedLogins = Math.max(
    analysis.failed_logins,
    0,
  );

  const authenticationEvents =
    successfulLogins + failedLogins;

  const otherEvents = Math.max(
    analysis.entries - authenticationEvents,
    0,
  );

  const failureRate =
    authenticationEvents > 0
      ? Math.round(
          (failedLogins / authenticationEvents) * 100,
        )
      : 0;

  const successRate =
    authenticationEvents > 0
      ? Math.round(
          (successfulLogins / authenticationEvents) *
            100,
        )
      : 0;

  const chartData: AuthenticationChartItem[] = [
    {
      name: "Successful",
      value: successfulLogins,
      color: "#22c55e",
      description:
        "Authentication attempts completed successfully.",
    },
    {
      name: "Failed",
      value: failedLogins,
      color: "#ef4444",
      description:
        "Authentication attempts that were rejected.",
    },
    {
      name: "Other Events",
      value: otherEvents,
      color: "#3b82f6",
      description:
        "Analyzed events that were not classified as login attempts.",
    },
  ];

  const hasActivity = chartData.some(
    (item) => item.value > 0,
  );

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Authentication Activity
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Interactive comparison of authentication and
            security-event activity.
          </p>
        </div>

        <div className="rounded-lg bg-cyan-500/15 p-3">
          <Activity className="h-7 w-7 text-cyan-400" />
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-700 bg-slate-950/40 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-400" />

            <p className="text-sm text-slate-400">
              Success Rate
            </p>
          </div>

          <p className="mt-2 text-2xl font-bold text-green-300">
            {successRate}%
          </p>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-950/40 p-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-red-400" />

            <p className="text-sm text-slate-400">
              Failure Rate
            </p>
          </div>

          <p className="mt-2 text-2xl font-bold text-red-300">
            {failureRate}%
          </p>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-950/40 p-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-400" />

            <p className="text-sm text-slate-400">
              Authentication Events
            </p>
          </div>

          <p className="mt-2 text-2xl font-bold text-white">
            {authenticationEvents.toLocaleString()}
          </p>
        </div>
      </div>

      {hasActivity ? (
        <div className="mt-6 h-80 w-full">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 20,
                bottom: 10,
                left: 0,
              }}
            >
              <CartesianGrid
                stroke="#334155"
                strokeDasharray="4 4"
                vertical={false}
              />

              <XAxis
                dataKey="name"
                tick={{
                  fill: "#cbd5e1",
                  fontSize: 12,
                }}
                axisLine={{
                  stroke: "#475569",
                }}
                tickLine={false}
              />

              <YAxis
                allowDecimals={false}
                tick={{
                  fill: "#94a3b8",
                  fontSize: 12,
                }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                cursor={{
                  fill: "rgba(51, 65, 85, 0.25)",
                }}
                content={<AuthenticationTooltip />}
              />

              <Bar
                dataKey="value"
                radius={[8, 8, 0, 0]}
                barSize={70}
                isAnimationActive
                animationDuration={800}
              >
                {chartData.map((item) => (
                  <Cell
                    key={item.name}
                    fill={item.color}
                  />
                ))}

                <LabelList
                  dataKey="value"
                  position="top"
                  fill="#e2e8f0"
                  fontSize={13}
                  fontWeight={700}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-6 flex min-h-72 flex-col items-center justify-center rounded-lg border border-slate-700 bg-slate-950/30 p-8 text-center">
          <Activity className="h-10 w-10 text-slate-500" />

          <h3 className="mt-4 text-lg font-semibold text-white">
            No activity available
          </h3>

          <p className="mt-2 max-w-md text-sm text-slate-400">
            Analyze a log containing authentication or
            security events to populate this chart.
          </p>
        </div>
      )}

      <div className="mt-4 border-t border-slate-700 pt-4">
        <p className="text-xs leading-5 text-slate-500">
          Hover over each bar to view its event count and
          classification details.
        </p>
      </div>
    </section>
  );
}

export default AuthenticationActivityChart;
