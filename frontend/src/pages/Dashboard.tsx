import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileSearch,
  Gauge,
  Network,
  ShieldAlert,
  Upload,
} from "lucide-react";

import StatCard from "../components/StatCard";
import type { Detection, UploadResult } from "../services/api";

const STORAGE_KEY = "sentinelai_latest_analysis";

const riskStyles: Record<UploadResult["risk_level"], string> = {
  Critical: "border-red-500/40 bg-red-500/15 text-red-300",
  High: "border-orange-500/40 bg-orange-500/15 text-orange-300",
  Medium: "border-amber-500/40 bg-amber-500/15 text-amber-300",
  Low: "border-green-500/40 bg-green-500/15 text-green-300",
};

const riskBarStyles: Record<UploadResult["risk_level"], string> = {
  Critical: "bg-red-500",
  High: "bg-orange-500",
  Medium: "bg-amber-500",
  Low: "bg-green-500",
};

const severityStyles: Record<Detection["severity"], string> = {
  Critical: "border-red-500/40 bg-red-500/15 text-red-300",
  High: "border-orange-500/40 bg-orange-500/15 text-orange-300",
  Medium: "border-amber-500/40 bg-amber-500/15 text-amber-300",
  Low: "border-blue-500/40 bg-blue-500/15 text-blue-300",
};

function Dashboard() {
  const [analysis, setAnalysis] = useState<UploadResult | null>(null);

  useEffect(() => {
    const savedAnalysis = localStorage.getItem(STORAGE_KEY);

    if (!savedAnalysis) {
      return;
    }

    try {
      const parsedAnalysis = JSON.parse(
        savedAnalysis,
      ) as UploadResult;

      setAnalysis(parsedAnalysis);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const uniqueMitreTechniques = useMemo(() => {
    if (!analysis) {
      return [];
    }

    return Array.from(
      new Set(
        analysis.detections.map(
          (detection) => detection.mitre_id,
        ),
      ),
    );
  }, [analysis]);

  const topSuspiciousIps = useMemo(() => {
    if (!analysis) {
      return [];
    }

    return [...analysis.suspicious_ips]
      .sort((firstIp, secondIp) => {
        return secondIp.attempts - firstIp.attempts;
      })
      .slice(0, 5);
  }, [analysis]);

  const recentDetections = analysis?.detections.slice(0, 4) ?? [];

  if (!analysis) {
    return <EmptyDashboard />;
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <h1 className="text-4xl font-bold">
              Good Morning, Dipan 👋
            </h1>

            <p className="mt-2 text-slate-400">
              SentinelAI analyzed{" "}
              {analysis.entries.toLocaleString()} security events from{" "}
              <span className="font-medium text-slate-300">
                {analysis.filename}
              </span>
              .
            </p>
          </div>

          <Link
            to="/upload"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium transition hover:bg-blue-700"
          >
            <Upload className="h-5 w-5" />
            Analyze New Logs
          </Link>
        </div>

        <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Critical"
            value={analysis.severity_summary.critical}
            color="#ef4444"
          />

          <StatCard
            title="High"
            value={analysis.severity_summary.high}
            color="#f97316"
          />

          <StatCard
            title="Medium"
            value={analysis.severity_summary.medium}
            color="#eab308"
          />

          <StatCard
            title="Low"
            value={analysis.severity_summary.low}
            color="#22c55e"
          />
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <RiskOverview analysis={analysis} />

          <AuthenticationOverview analysis={analysis} />
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-2">
          <RecentAlerts detections={recentDetections} />

          <TopSuspiciousIps
            suspiciousIps={topSuspiciousIps}
          />
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <MitreTechniques techniques={uniqueMitreTechniques} />

          <RecommendationPanel analysis={analysis} />
        </section>
      </div>
    </div>
  );
}

type RiskOverviewProps = {
  analysis: UploadResult;
};

function RiskOverview({
  analysis,
}: RiskOverviewProps) {
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
              Calculated from severity, confidence, and
              authentication behavior.
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
          / 100
        </p>
      </div>

      <div className="mt-6 h-4 overflow-hidden rounded-full bg-slate-950">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            riskBarStyles[analysis.risk_level]
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

type AuthenticationOverviewProps = {
  analysis: UploadResult;
};

function AuthenticationOverview({
  analysis,
}: AuthenticationOverviewProps) {
  const totalAuthenticationEvents =
    analysis.failed_logins + analysis.successful_logins;

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

type RecentAlertsProps = {
  detections: Detection[];
};

function RecentAlerts({
  detections,
}: RecentAlertsProps) {
  return (
    <section className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-lg">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">
            Recent Security Alerts
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Highest-priority detections from the latest analysis.
          </p>
        </div>

        <ShieldAlert className="h-7 w-7 text-red-400" />
      </div>

      <div className="mt-6 space-y-4">
        {detections.length > 0 ? (
          detections.map((detection, index) => (
            <article
              key={`${detection.type}-${detection.source_ip}-${index}`}
              className="rounded-lg border border-slate-700 bg-slate-950/60 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">
                    {detection.type}
                  </h3>

                  <p className="mt-1 text-sm text-slate-400">
                    {detection.source_ip
                      ? `Source: ${detection.source_ip}`
                      : "No source IP identified"}
                  </p>
                </div>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    severityStyles[detection.severity]
                  }`}
                >
                  {detection.severity}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                <span className="text-blue-400">
                  {detection.mitre_id}
                </span>

                <span className="text-green-400">
                  {detection.confidence}% confidence
                </span>

                <span className="text-slate-400">
                  {detection.event_count} event(s)
                </span>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-5">
            <p className="font-semibold text-green-300">
              No security alerts detected
            </p>

            <p className="mt-1 text-sm text-green-400">
              The latest log did not match any active detection
              rules.
            </p>
          </div>
        )}
      </div>

      <Link
        to="/upload"
        className="mt-6 flex items-center justify-center gap-2 rounded-lg border border-slate-600 px-4 py-3 font-medium text-slate-200 transition hover:border-blue-500 hover:text-blue-400"
      >
        View Full Analysis
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}

type SuspiciousIp = UploadResult["suspicious_ips"][number];

type TopSuspiciousIpsProps = {
  suspiciousIps: SuspiciousIp[];
};

function TopSuspiciousIps({
  suspiciousIps,
}: TopSuspiciousIpsProps) {
  return (
    <section className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-lg">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">
            Top Suspicious IPs
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Sources producing repeated failed authentication
            attempts.
          </p>
        </div>

        <Network className="h-7 w-7 text-orange-400" />
      </div>

      <div className="mt-6 space-y-4">
        {suspiciousIps.length > 0 ? (
          suspiciousIps.map((suspiciousIp, index) => (
            <article
              key={suspiciousIp.ip}
              className="rounded-lg border border-slate-700 bg-slate-950/60 p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/15 text-sm font-bold text-orange-300">
                    {index + 1}
                  </div>

                  <div>
                    <p className="font-mono font-semibold text-red-300">
                      {suspiciousIp.ip}
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      {suspiciousIp.targeted_users.length} account(s)
                      targeted
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-300">
                    {suspiciousIp.attempts}
                  </p>

                  <p className="text-xs text-slate-500">
                    failed attempts
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {suspiciousIp.targeted_users.map((user) => (
                  <span
                    key={user}
                    className="rounded-md bg-slate-800 px-3 py-1 text-xs text-slate-300"
                  >
                    {user}
                  </span>
                ))}
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-5">
            <p className="font-semibold text-green-300">
              No suspicious IP addresses
            </p>

            <p className="mt-1 text-sm text-green-400">
              No source exceeded the current failed-login
              threshold.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

type MitreTechniquesProps = {
  techniques: string[];
};

function MitreTechniques({
  techniques,
}: MitreTechniquesProps) {
  return (
    <section className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-blue-500/15 p-3">
          <FileSearch className="h-7 w-7 text-blue-400" />
        </div>

        <div>
          <h2 className="text-2xl font-bold">
            MITRE ATT&CK
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Techniques identified in the latest analysis.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {techniques.length > 0 ? (
          techniques.map((technique) => (
            <span
              key={technique}
              className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 font-mono font-semibold text-blue-300"
            >
              {technique}
            </span>
          ))
        ) : (
          <p className="text-sm text-slate-400">
            No MITRE ATT&CK techniques were identified.
          </p>
        )}
      </div>

      <Link
        to="/mitre"
        className="mt-6 flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300"
      >
        Open MITRE Explorer
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}

type RecommendationPanelProps = {
  analysis: UploadResult;
};

function RecommendationPanel({
  analysis,
}: RecommendationPanelProps) {
  const primaryDetection = analysis.detections[0];

  return (
    <section className="rounded-xl border border-blue-500/30 bg-gradient-to-br from-slate-800 to-blue-950/40 p-6 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-blue-500/15 p-3">
          <Clock3 className="h-7 w-7 text-blue-400" />
        </div>

        <div>
          <h2 className="text-2xl font-bold">
            Today's Recommendation
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Suggested next action based on the latest evidence.
          </p>
        </div>
      </div>

      {primaryDetection ? (
        <>
          <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold">
                Investigate {primaryDetection.type}
              </h3>

              <p className="mt-2 max-w-3xl text-slate-300">
                {primaryDetection.description}
              </p>
            </div>

            <span
              className={`rounded-full border px-4 py-2 text-sm font-bold ${
                severityStyles[primaryDetection.severity]
              }`}
            >
              {primaryDetection.severity}
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <RecommendationMetric
              label="Confidence"
              value={`${primaryDetection.confidence}%`}
            />

            <RecommendationMetric
              label="MITRE Technique"
              value={primaryDetection.mitre_id}
            />

            <RecommendationMetric
              label="Source IP"
              value={primaryDetection.source_ip ?? "Unknown"}
              isMonospace
            />
          </div>

          <div className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-5">
            <p className="font-semibold text-amber-300">
              First recommended action
            </p>

            <p className="mt-2 text-sm text-slate-300">
              {primaryDetection.recommendations[0] ??
                "Review the related security events and validate the detection."}
            </p>
          </div>

          <Link
            to="/upload"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium transition hover:bg-blue-700"
          >
            Start Investigation
            <ArrowRight className="h-4 w-4" />
          </Link>
        </>
      ) : (
        <div className="mt-6 rounded-lg border border-green-500/30 bg-green-500/10 p-5">
          <p className="font-semibold text-green-300">
            No immediate investigation required
          </p>

          <p className="mt-2 text-sm text-green-400">
            Continue monitoring and analyze additional security logs.
          </p>
        </div>
      )}
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

type RecommendationMetricProps = {
  label: string;
  value: string;
  isMonospace?: boolean;
};

function RecommendationMetric({
  label,
  value,
  isMonospace = false,
}: RecommendationMetricProps) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-4">
      <p className="text-sm text-slate-400">
        {label}
      </p>

      <p
        className={`mt-1 break-words font-semibold text-white ${
          isMonospace ? "font-mono" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function EmptyDashboard() {
  return (
    <div className="min-h-screen bg-slate-900 p-8 text-white">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold">
          Good Morning, Dipan 👋
        </h1>

        <p className="mt-2 text-slate-400">
          Your live SOC dashboard will appear after you analyze a
          security log.
        </p>

        <section className="mt-10 rounded-xl border border-dashed border-slate-600 bg-slate-800 p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/15">
            <Upload className="h-8 w-8 text-blue-400" />
          </div>

          <h2 className="mt-6 text-2xl font-bold">
            No analysis data available
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-slate-400">
            Upload and analyze an authentication log to populate the
            dashboard with risk scores, alerts, suspicious IPs, and
            MITRE ATT&CK techniques.
          </p>

          <Link
            to="/upload"
            className="mt-7 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium transition hover:bg-blue-700"
          >
            Upload Security Logs
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
