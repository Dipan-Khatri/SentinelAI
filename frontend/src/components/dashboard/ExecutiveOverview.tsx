import {
  CheckCircle2,
  Clock3,
  FileText,
  Network,
  ShieldAlert,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import StatCard from "../StatCard";

import type {
  Investigation,
  UploadResult,
} from "../../services/api";

type ExecutiveOverviewProps = {
  analysis: UploadResult;
  investigations: Investigation[];
};

function ExecutiveOverview({
  analysis,
  investigations,
}: ExecutiveOverviewProps) {
  const openCases = investigations.filter(
    (investigation) =>
      investigation.status?.toLowerCase() ===
      "open",
  ).length;

  const activeCases = investigations.filter(
    (investigation) =>
      investigation.status?.toLowerCase() ===
      "in progress",
  ).length;

  const resolvedCases = investigations.filter(
    (investigation) =>
      investigation.status?.toLowerCase() ===
      "resolved",
  ).length;

  const highestRiskIp = [
    ...analysis.suspicious_ips,
  ].sort(
    (
      firstIp,
      secondIp,
    ) =>
      secondIp.attempts -
      firstIp.attempts,
  )[0];

  const animatedOpenCases =
    useAnimatedCounter(openCases);

  const animatedActiveCases =
    useAnimatedCounter(activeCases);

  const animatedResolvedCases =
    useAnimatedCounter(resolvedCases);

  const animatedCriticalAlerts =
    useAnimatedCounter(
      analysis.severity_summary.critical,
    );

  const animatedHighAlerts =
    useAnimatedCounter(
      analysis.severity_summary.high,
    );

  const animatedFailedLogins =
    useAnimatedCounter(
      analysis.failed_logins,
    );

  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
            Security Operations Center
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            Executive SOC Overview
          </h2>
        </div>

        <p className="text-sm text-slate-500">
          Current view based on the active analysis and
          saved investigations.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Open Cases"
          value={animatedOpenCases}
          accentClass="text-red-400"
          icon={ShieldAlert}
          subtitle="Saved investigations requiring analyst review."
        />

        <StatCard
          title="Active Investigations"
          value={animatedActiveCases}
          accentClass="text-amber-400"
          icon={Clock3}
          subtitle="Cases currently marked as In Progress."
        />

        <StatCard
          title="Resolved Cases"
          value={animatedResolvedCases}
          accentClass="text-green-400"
          icon={CheckCircle2}
          subtitle="Completed SOC investigations."
        />

        <StatCard
          title="Highest-Risk IP"
          value={highestRiskIp?.ip ?? "None"}
          accentClass="text-orange-400"
          icon={Network}
          subtitle={
            highestRiskIp
              ? `${highestRiskIp.attempts} suspicious attempt(s)`
              : "No suspicious source exceeded the threshold."
          }
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Critical Alerts"
          value={animatedCriticalAlerts}
          accentClass="text-red-400"
          icon={ShieldAlert}
          subtitle="Critical detections in the active analysis."
        />

        <StatCard
          title="High Alerts"
          value={animatedHighAlerts}
          accentClass="text-orange-400"
          icon={ShieldAlert}
          subtitle="High-severity detections in the active analysis."
        />

        <StatCard
          title="Failed Logins"
          value={animatedFailedLogins}
          accentClass="text-rose-400"
          icon={ShieldAlert}
          subtitle="Failed authentication events parsed."
        />

        <StatCard
          title="Last Analysis"
          value={analysis.filename}
          accentClass="text-blue-400"
          icon={FileText}
          subtitle={`${analysis.entries.toLocaleString()} log entries reviewed.`}
        />
      </div>
    </section>
  );
}

function useAnimatedCounter(
  targetValue: number,
  duration = 800,
): number {
  const [displayValue, setDisplayValue] =
    useState(0);

  useEffect(() => {
    let animationFrameId = 0;

    const startTime =
      performance.now();

    function animate(
      currentTime: number,
    ) {
      const elapsedTime =
        currentTime - startTime;

      const progress = Math.min(
        elapsedTime / duration,
        1,
      );

      const easedProgress =
        1 -
        Math.pow(
          1 - progress,
          3,
        );

      setDisplayValue(
        Math.round(
          targetValue *
            easedProgress,
        ),
      );

      if (progress < 1) {
        animationFrameId =
          requestAnimationFrame(
            animate,
          );
      }
    }

    animationFrameId =
      requestAnimationFrame(
        animate,
      );

    return () => {
      cancelAnimationFrame(
        animationFrameId,
      );
    };
  }, [targetValue, duration]);

  return displayValue;
}

export default ExecutiveOverview;
