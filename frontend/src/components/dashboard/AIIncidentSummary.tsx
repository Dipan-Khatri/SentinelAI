import {
  Bot,
  BrainCircuit,
  CheckCircle2,
  Lightbulb,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

import type { UploadResult } from "../../services/api";

type AIIncidentSummaryProps = {
  analysis: UploadResult;
};

type RiskStyle = {
  label: string;
  textClass: string;
  backgroundClass: string;
  borderClass: string;
};

function getRiskStyle(riskLevel: string): RiskStyle {
  const normalizedRisk = riskLevel.toLowerCase();

  if (normalizedRisk === "critical") {
    return {
      label: "Critical Risk",
      textClass: "text-red-300",
      backgroundClass: "bg-red-500/10",
      borderClass: "border-red-500/30",
    };
  }

  if (normalizedRisk === "high") {
    return {
      label: "High Risk",
      textClass: "text-orange-300",
      backgroundClass: "bg-orange-500/10",
      borderClass: "border-orange-500/30",
    };
  }

  if (normalizedRisk === "medium") {
    return {
      label: "Medium Risk",
      textClass: "text-amber-300",
      backgroundClass: "bg-amber-500/10",
      borderClass: "border-amber-500/30",
    };
  }

  return {
    label: "Low Risk",
    textClass: "text-green-300",
    backgroundClass: "bg-green-500/10",
    borderClass: "border-green-500/30",
  };
}

function AIIncidentSummary({
  analysis,
}: AIIncidentSummaryProps) {
  const riskStyle = getRiskStyle(
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

  const sortedSuspiciousIps = [
    ...analysis.suspicious_ips,
  ].sort(
    (firstIp, secondIp) =>
      secondIp.attempts - firstIp.attempts,
  );

  const highestRiskIp = sortedSuspiciousIps[0];
  const primaryDetection = analysis.detections[0];

  const criticalAlerts =
    analysis.severity_summary.critical;

  const highAlerts =
    analysis.severity_summary.high;

  const highPriorityAlerts =
    criticalAlerts + highAlerts;

  const successfulCompromiseObserved =
    analysis.successful_logins > 0;

  const primaryRecommendation =
    primaryDetection?.recommendations?.[0] ??
    "Continue monitoring authentication activity and investigate repeated failures from suspicious sources.";

  const incidentNarrative = buildIncidentNarrative({
    filename: analysis.filename,
    entries: analysis.entries,
    failedLogins: analysis.failed_logins,
    successfulLogins: analysis.successful_logins,
    suspiciousIpCount:
      analysis.suspicious_ips.length,
    highestRiskIp: highestRiskIp?.ip,
    primaryDetectionType: primaryDetection?.type,
    primaryMitreId: primaryDetection?.mitre_id,
    riskLevel: analysis.risk_level,
    riskScore: analysis.risk_score,
  });

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-cyan-500/15 p-3">
            <BrainCircuit className="h-7 w-7 text-cyan-400" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-white">
                AI Incident Summary
              </h2>

              <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                <Sparkles className="h-3.5 w-3.5" />
                SentinelAI Generated
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-400">
              Automated explanation of the latest security
              analysis.
            </p>
          </div>
        </div>

        <div
          className={`rounded-full border px-4 py-2 text-sm font-semibold ${riskStyle.textClass} ${riskStyle.backgroundClass} ${riskStyle.borderClass}`}
        >
          {riskStyle.label}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-700 bg-slate-950/40 p-5">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-cyan-400" />

          <h3 className="font-semibold text-white">
            Executive Analysis
          </h3>
        </div>

        <p className="mt-4 text-sm leading-7 text-slate-300">
          {incidentNarrative}
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-700 bg-slate-950/30 p-5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-400" />

            <h3 className="font-semibold text-white">
              Authentication Risk
            </h3>
          </div>

          <p className="mt-4 text-3xl font-bold text-red-300">
            {failureRate}%
          </p>

          <p className="mt-1 text-sm text-slate-400">
            Failure rate across{" "}
            {authenticationEvents.toLocaleString()}{" "}
            authentication events.
          </p>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-950/30 p-5">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-purple-400" />

            <h3 className="font-semibold text-white">
              Primary Technique
            </h3>
          </div>

          <p className="mt-4 text-lg font-bold text-purple-300">
            {primaryDetection?.mitre_id ??
              "No technique detected"}
          </p>

          <p className="mt-1 text-sm text-slate-400">
            {primaryDetection?.type ??
              "No MITRE ATT&CK behavior was identified."}
          </p>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-950/30 p-5">
          <div className="flex items-center gap-2">
            {successfulCompromiseObserved ? (
              <ShieldAlert className="h-5 w-5 text-amber-400" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-green-400" />
            )}

            <h3 className="font-semibold text-white">
              Compromise Status
            </h3>
          </div>

          <p
            className={`mt-4 text-lg font-bold ${
              successfulCompromiseObserved
                ? "text-amber-300"
                : "text-green-300"
            }`}
          >
            {successfulCompromiseObserved
              ? "Successful logins observed"
              : "No successful login observed"}
          </p>

          <p className="mt-1 text-sm text-slate-400">
            Review successful authentication events to
            determine whether they were authorized.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-xl border border-slate-700 bg-slate-950/30 p-5">
          <h3 className="flex items-center gap-2 font-semibold text-white">
            <ShieldAlert className="h-5 w-5 text-orange-400" />
            Key Findings
          </h3>

          <div className="mt-4 space-y-3">
            <FindingItem
              text={`${analysis.failed_logins.toLocaleString()} failed login attempts were identified.`}
            />

            <FindingItem
              text={`${analysis.suspicious_ips.length.toLocaleString()} suspicious source IP address${
                analysis.suspicious_ips.length === 1
                  ? " was"
                  : "es were"
              } identified.`}
            />

            <FindingItem
              text={
                highestRiskIp
                  ? `${highestRiskIp.ip} produced the highest suspicious activity with ${highestRiskIp.attempts.toLocaleString()} attempt(s).`
                  : "No repeated suspicious source activity was identified."
              }
            />

            <FindingItem
              text={`${analysis.detections.length.toLocaleString()} detection${
                analysis.detections.length === 1
                  ? " was"
                  : "s were"
              } generated, including ${highPriorityAlerts.toLocaleString()} high-priority alert(s).`}
            />
          </div>
        </div>

        <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-5">
          <h3 className="flex items-center gap-2 font-semibold text-blue-200">
            <Lightbulb className="h-5 w-5 text-blue-400" />
            Recommended Analyst Action
          </h3>

          <p className="mt-4 text-sm leading-7 text-slate-300">
            {primaryRecommendation}
          </p>

          <div className="mt-4 rounded-lg border border-blue-500/20 bg-slate-950/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-300">
              Suggested workflow
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-300">
              Validate the source IP, review the complete
              authentication timeline, confirm whether any
              successful login was authorized, and escalate
              the case when malicious activity is confirmed.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-slate-700 pt-4">
        <p className="text-xs leading-5 text-slate-500">
          This summary is generated from SentinelAI parser,
          detection, risk-scoring, suspicious-IP, and MITRE
          ATT&CK results. Analyst validation is still
          required.
        </p>
      </div>
    </section>
  );
}

type FindingItemProps = {
  text: string;
};

function FindingItem({ text }: FindingItemProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-900/50 p-3">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />

      <p className="text-sm leading-6 text-slate-300">
        {text}
      </p>
    </div>
  );
}

type IncidentNarrativeOptions = {
  filename: string;
  entries: number;
  failedLogins: number;
  successfulLogins: number;
  suspiciousIpCount: number;
  highestRiskIp?: string;
  primaryDetectionType?: string;
  primaryMitreId?: string;
  riskLevel: string;
  riskScore: number;
};

function buildIncidentNarrative({
  filename,
  entries,
  failedLogins,
  successfulLogins,
  suspiciousIpCount,
  highestRiskIp,
  primaryDetectionType,
  primaryMitreId,
  riskLevel,
  riskScore,
}: IncidentNarrativeOptions) {
  const authenticationSummary =
    failedLogins > 0
      ? `The analysis identified ${failedLogins.toLocaleString()} failed login attempt${
          failedLogins === 1 ? "" : "s"
        } and ${successfulLogins.toLocaleString()} successful login attempt${
          successfulLogins === 1 ? "" : "s"
        }.`
      : `No failed login attempts were identified, while ${successfulLogins.toLocaleString()} successful login attempt${
          successfulLogins === 1 ? " was" : "s were"
        } recorded.`;

  const sourceSummary =
    suspiciousIpCount > 0
      ? `${suspiciousIpCount.toLocaleString()} suspicious source IP address${
          suspiciousIpCount === 1
            ? " was"
            : "es were"
        } identified${
          highestRiskIp
            ? `, with ${highestRiskIp} producing the most notable activity`
            : ""
        }.`
      : "No source IP met the current suspicious-activity threshold.";

  const detectionSummary =
    primaryDetectionType && primaryMitreId
      ? `The primary behavior was classified as ${primaryDetectionType} and mapped to MITRE ATT&CK technique ${primaryMitreId}.`
      : "No primary MITRE ATT&CK technique was identified.";

  return `SentinelAI processed ${entries.toLocaleString()} security events from ${filename}. ${authenticationSummary} ${sourceSummary} ${detectionSummary} The resulting assessment is ${riskLevel.toLowerCase()} risk with a score of ${riskScore}/100.`;
}

export default AIIncidentSummary;
