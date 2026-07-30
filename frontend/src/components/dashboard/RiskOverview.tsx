import {
  Activity,
  Gauge,
  Network,
  ShieldAlert,
} from "lucide-react";

import type { UploadResult } from "../../services/api";

const riskStyles: Record<
  UploadResult["risk_level"],
  string
> = {
  Critical:
    "border-red-500/40 bg-red-500/15 text-red-300",
  High:
    "border-orange-500/40 bg-orange-500/15 text-orange-300",
  Medium:
    "border-amber-500/40 bg-amber-500/15 text-amber-300",
  Low:
    "border-green-500/40 bg-green-500/15 text-green-300",
};

const riskBarStyles: Record<
  UploadResult["risk_level"],
  string
> = {
  Critical: "bg-red-500",
  High: "bg-orange-500",
  Medium: "bg-amber-500",
  Low: "bg-green-500",
};

type Props = {
  analysis: UploadResult;
};

function RiskOverview({
  analysis,
}: Props) {
  return (
    <section className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-500/15 p-3">
            <Gauge className="h-7 w-7 text-blue-400" />
          </div>

          <div>
            <h2 className="text-2xl font-bold">
              Overall Security Risk
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Calculated from severity,
              authentication behavior,
              suspicious activity,
              and MITRE ATT&CK detections.
            </p>
          </div>
        </div>

        <span
          className={`rounded-full border px-4 py-2 text-sm font-bold ${
            riskStyles[analysis.risk_level]
          }`}
        >
          {analysis.risk_level} Risk
        </span>
      </div>

      <div className="mt-8 flex items-end gap-3">
        <p className="text-6xl font-bold">
          {analysis.risk_score}
        </p>

        <p className="pb-2 text-xl text-slate-400">
          /100
        </p>
      </div>

      <div className="mt-6 h-4 overflow-hidden rounded-full bg-slate-950">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            riskBarStyles[
              analysis.risk_level
            ]
          }`}
          style={{
            width: `${analysis.risk_score}%`,
          }}
        />
      </div>

      <div className="mt-3 flex justify-between text-xs text-slate-500">
        <span>Low</span>
        <span>Medium</span>
        <span>High</span>
        <span>Critical</span>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <SmallMetric
          label="Total Detections"
          value={analysis.detections.length}
          icon={ShieldAlert}
          iconClass="text-red-400"
        />

        <SmallMetric
          label="Suspicious IPs"
          value={analysis.suspicious_ips.length}
          icon={Network}
          iconClass="text-orange-400"
        />

        <SmallMetric
          label="Log Entries"
          value={analysis.entries}
          icon={Activity}
          iconClass="text-blue-400"
        />
      </div>
    </section>
  );
}

type SmallMetricProps = {
  label: string;
  value: number;
  icon: React.ElementType;
  iconClass: string;
};

function SmallMetric({
  label,
  value,
  icon: Icon,
  iconClass,
}: SmallMetricProps) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-4">
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${iconClass}`} />

        <p className="text-sm text-slate-400">
          {label}
        </p>
      </div>

      <p className="mt-3 text-2xl font-bold">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

export default RiskOverview;
