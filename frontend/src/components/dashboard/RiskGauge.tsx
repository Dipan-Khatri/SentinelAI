import {
  AlertTriangle,
  Gauge,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import {
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from "recharts";

import type { UploadResult } from "../../services/api";

type RiskGaugeProps = {
  analysis: UploadResult;
};

type RiskLevelStyle = {
  label: string;
  color: string;
  textClass: string;
  backgroundClass: string;
  borderClass: string;
  description: string;
};

function getRiskStyle(
  riskScore: number,
  riskLevel: string,
): RiskLevelStyle {
  const normalizedLevel = riskLevel.toLowerCase();

  if (
    normalizedLevel === "critical" ||
    riskScore >= 80
  ) {
    return {
      label: "Critical",
      color: "#ef4444",
      textClass: "text-red-300",
      backgroundClass: "bg-red-500/10",
      borderClass: "border-red-500/30",
      description:
        "Immediate investigation and containment are recommended.",
    };
  }

  if (
    normalizedLevel === "high" ||
    riskScore >= 60
  ) {
    return {
      label: "High",
      color: "#f97316",
      textClass: "text-orange-300",
      backgroundClass: "bg-orange-500/10",
      borderClass: "border-orange-500/30",
      description:
        "Elevated malicious activity requires analyst review.",
    };
  }

  if (
    normalizedLevel === "medium" ||
    riskScore >= 30
  ) {
    return {
      label: "Medium",
      color: "#f59e0b",
      textClass: "text-amber-300",
      backgroundClass: "bg-amber-500/10",
      borderClass: "border-amber-500/30",
      description:
        "Suspicious behavior was identified and should be monitored.",
    };
  }

  return {
    label: "Low",
    color: "#22c55e",
    textClass: "text-green-300",
    backgroundClass: "bg-green-500/10",
    borderClass: "border-green-500/30",
    description:
      "No significant security risk was identified in the latest analysis.",
  };
}

function RiskGauge({ analysis }: RiskGaugeProps) {
  const riskScore = Math.min(
    Math.max(analysis.risk_score, 0),
    100,
  );

  const riskStyle = getRiskStyle(
    riskScore,
    analysis.risk_level,
  );

  const authenticationEvents =
    analysis.failed_logins +
    analysis.successful_logins;

  const failureRate =
    authenticationEvents > 0
      ? Math.round(
          (analysis.failed_logins /
            authenticationEvents) *
            100,
        )
      : 0;

  const criticalAndHighAlerts =
    analysis.severity_summary.critical +
    analysis.severity_summary.high;

  const suspiciousIpCount =
    analysis.suspicious_ips.length;

  const gaugeData = [
    {
      name: "Risk Score",
      value: riskScore,
      fill: riskStyle.color,
    },
  ];

  const RiskIcon =
    riskScore >= 80
      ? ShieldX
      : riskScore >= 30
        ? AlertTriangle
        : ShieldCheck;

  return (
    <section className="flex h-full flex-col rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">
            AI Risk Gauge
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Overall threat score calculated from the latest
            security analysis.
          </p>
        </div>

        <div className="rounded-lg bg-purple-500/15 p-3">
          <Gauge className="h-7 w-7 text-purple-400" />
        </div>
      </div>

      <div className="relative mt-4 h-72 w-full">
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <RadialBarChart
            cx="50%"
            cy="58%"
            innerRadius="70%"
            outerRadius="100%"
            barSize={24}
            data={gaugeData}
            startAngle={210}
            endAngle={-30}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              angleAxisId={0}
              tick={false}
            />

            <RadialBar
              dataKey="value"
              background={{
                fill: "#0f172a",
              }}
              cornerRadius={20}
              isAnimationActive
              animationDuration={1000}
            />
          </RadialBarChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-10">
          <RiskIcon
            className={`h-8 w-8 ${riskStyle.textClass}`}
          />

          <div className="mt-2 flex items-end gap-1">
            <span className="text-5xl font-bold text-white">
              {riskScore}
            </span>

            <span className="mb-1 text-lg text-slate-500">
              /100
            </span>
          </div>

          <span
            className={`mt-3 rounded-full border px-4 py-1 text-sm font-semibold ${riskStyle.textClass} ${riskStyle.backgroundClass} ${riskStyle.borderClass}`}
          >
            {riskStyle.label} Risk
          </span>
        </div>
      </div>

      <div
        className={`rounded-lg border p-4 ${riskStyle.backgroundClass} ${riskStyle.borderClass}`}
      >
        <p
          className={`text-sm font-semibold ${riskStyle.textClass}`}
        >
          SentinelAI assessment
        </p>

        <p className="mt-1 text-sm leading-6 text-slate-300">
          {riskStyle.description}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-slate-700 bg-slate-950/40 p-3">
          <p className="text-xs text-slate-400">
            Failure Rate
          </p>

          <p className="mt-2 text-xl font-bold text-red-300">
            {failureRate}%
          </p>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-950/40 p-3">
          <p className="text-xs text-slate-400">
            High Priority
          </p>

          <p className="mt-2 text-xl font-bold text-orange-300">
            {criticalAndHighAlerts}
          </p>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-950/40 p-3">
          <p className="text-xs text-slate-400">
            Suspicious IPs
          </p>

          <p className="mt-2 text-xl font-bold text-blue-300">
            {suspiciousIpCount}
          </p>
        </div>
      </div>

      <div className="mt-auto border-t border-slate-700 pt-4">
        <p className="text-xs leading-5 text-slate-500">
          The score combines authentication failures,
          alert severity, suspicious sources, and detected
          attack techniques.
        </p>
      </div>
    </section>
  );
}

export default RiskGauge;


