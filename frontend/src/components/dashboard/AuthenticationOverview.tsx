import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";

import type { UploadResult } from "../../services/api";

type Props = {
  analysis: UploadResult;
};

function AuthenticationOverview({
  analysis,
}: Props) {
  const totalAuthenticationEvents =
    analysis.failed_logins +
    analysis.successful_logins;

  const failurePercentage =
    totalAuthenticationEvents > 0
      ? Math.round(
          (analysis.failed_logins /
            totalAuthenticationEvents) *
            100,
        )
      : 0;

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-purple-500/15 p-3">
          <Activity className="h-7 w-7 text-purple-400" />
        </div>

        <div>
          <h2 className="text-2xl font-bold">
            Authentication Activity
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Summary of parsed SSH authentication events.
          </p>
        </div>
      </div>

      <div className="mt-7 space-y-4">
        <AuthenticationMetric
          label="Failed Logins"
          value={analysis.failed_logins}
          icon={AlertTriangle}
          iconClass="text-orange-400"
          valueClass="text-orange-300"
        />

        <AuthenticationMetric
          label="Successful Logins"
          value={analysis.successful_logins}
          icon={CheckCircle2}
          iconClass="text-green-400"
          valueClass="text-green-300"
        />

        <AuthenticationMetric
          label="Failure Rate"
          value={`${failurePercentage}%`}
          icon={ShieldAlert}
          iconClass="text-red-400"
          valueClass="text-red-300"
        />
      </div>

      <div className="mt-6 rounded-lg border border-slate-700 bg-slate-950/50 p-4">
        <p className="text-sm text-slate-400">
          Authentication events reviewed
        </p>

        <p className="mt-1 text-3xl font-bold">
          {totalAuthenticationEvents}
        </p>
      </div>
    </section>
  );
}

type AuthenticationMetricProps = {
  label: string;
  value: number | string;
  icon: React.ElementType;
  iconClass: string;
  valueClass: string;
};

function AuthenticationMetric({
  label,
  value,
  icon: Icon,
  iconClass,
  valueClass,
}: AuthenticationMetricProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-950/50 p-4">
      <div className="flex items-center gap-3">
        <Icon className={`h-5 w-5 ${iconClass}`} />

        <p className="text-sm text-slate-300">
          {label}
        </p>
      </div>

      <p className={`text-xl font-bold ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

export default AuthenticationOverview;
