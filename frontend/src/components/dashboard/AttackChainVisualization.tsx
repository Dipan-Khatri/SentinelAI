import {
  AlertTriangle,
  ArrowDown,
  Bot,
  CheckCircle2,
  CircleDot,
  KeyRound,
  Network,
  ShieldAlert,
  Target,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";

import type {
  Detection,
  UploadResult,
} from "../../services/api";

type AttackChainVisualizationProps = {
  analysis: UploadResult;
};

type AttackStageStatus =
  | "Observed"
  | "Detected"
  | "Assessed"
  | "Recommended";

type AttackStage = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  status: AttackStageStatus;
  severity: Detection["severity"] | "Info";
  icon: typeof Network;
  evidence: string[];
};

type SeverityStyle = {
  borderClass: string;
  backgroundClass: string;
  textClass: string;
  iconBackgroundClass: string;
  connectorClass: string;
};

const severityOrder: Record<
  Detection["severity"],
  number
> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

function getSeverityStyle(
  severity: Detection["severity"] | "Info",
): SeverityStyle {
  if (severity === "Critical") {
    return {
      borderClass: "border-red-500/40",
      backgroundClass: "bg-red-500/10",
      textClass: "text-red-300",
      iconBackgroundClass: "bg-red-500/15",
      connectorClass: "text-red-500",
    };
  }

  if (severity === "High") {
    return {
      borderClass: "border-orange-500/40",
      backgroundClass: "bg-orange-500/10",
      textClass: "text-orange-300",
      iconBackgroundClass: "bg-orange-500/15",
      connectorClass: "text-orange-500",
    };
  }

  if (severity === "Medium") {
    return {
      borderClass: "border-amber-500/40",
      backgroundClass: "bg-amber-500/10",
      textClass: "text-amber-300",
      iconBackgroundClass: "bg-amber-500/15",
      connectorClass: "text-amber-500",
    };
  }

  if (severity === "Low") {
    return {
      borderClass: "border-blue-500/40",
      backgroundClass: "bg-blue-500/10",
      textClass: "text-blue-300",
      iconBackgroundClass: "bg-blue-500/15",
      connectorClass: "text-blue-500",
    };
  }

  return {
    borderClass: "border-slate-600",
    backgroundClass: "bg-slate-900/60",
    textClass: "text-slate-300",
    iconBackgroundClass: "bg-slate-700/60",
    connectorClass: "text-slate-600",
  };
}

function getRiskSeverity(
  riskLevel: string,
): Detection["severity"] {
  const normalizedRisk =
    riskLevel.toLowerCase();

  if (normalizedRisk === "critical") {
    return "Critical";
  }

  if (normalizedRisk === "high") {
    return "High";
  }

  if (normalizedRisk === "medium") {
    return "Medium";
  }

  return "Low";
}

function getHighestSeverity(
  detections: Detection[],
): Detection["severity"] {
  if (detections.length === 0) {
    return "Low";
  }

  return detections.reduce(
    (highestSeverity, detection) =>
      severityOrder[detection.severity] >
      severityOrder[highestSeverity]
        ? detection.severity
        : highestSeverity,
    detections[0].severity,
  );
}

function AttackChainVisualization({
  analysis,
}: AttackChainVisualizationProps) {
  const [selectedStageId, setSelectedStageId] =
    useState<string | null>(null);

  const attackStages = useMemo(
    () => buildAttackStages(analysis),
    [analysis],
  );

  const selectedStage =
    attackStages.find(
      (stage) => stage.id === selectedStageId,
    ) ??
    attackStages[0] ??
    null;

  const observedStages = attackStages.filter(
    (stage) => stage.status === "Observed",
  ).length;

  const detectedStages = attackStages.filter(
    (stage) => stage.status === "Detected",
  ).length;

  const highestSeverity =
    getHighestSeverity(analysis.detections);

  if (attackStages.length === 0) {
    return (
      <section className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-lg">
        <div className="flex min-h-72 flex-col items-center justify-center text-center">
          <CheckCircle2 className="h-12 w-12 text-green-400" />

          <h2 className="mt-4 text-xl font-bold text-white">
            No attack chain identified
          </h2>

          <p className="mt-2 max-w-lg text-sm leading-6 text-slate-400">
            The latest analysis did not contain enough
            suspicious activity to construct an incident
            attack chain.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-red-500/15 p-3">
            <Target className="h-7 w-7 text-red-400" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white">
              Attack Chain Visualization
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Follow the sequence of observed activity,
              detections, risk assessment, and analyst
              response.
            </p>
          </div>
        </div>

        <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-xs font-semibold text-purple-300">
          Incident Storyline
        </span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <SummaryMetric
          label="Attack Stages"
          value={attackStages.length}
          valueClass="text-blue-300"
        />

        <SummaryMetric
          label="Observed / Detected"
          value={observedStages + detectedStages}
          valueClass="text-orange-300"
        />

        <SummaryMetric
          label="Highest Severity"
          value={highestSeverity}
          valueClass={
            getSeverityStyle(highestSeverity)
              .textClass
          }
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-slate-700 bg-slate-950/30 p-4 sm:p-6">
          <div className="space-y-0">
            {attackStages.map((stage, index) => {
              const severityStyle =
                getSeverityStyle(stage.severity);

              const isSelected =
                selectedStage?.id === stage.id;

              return (
                <div key={stage.id}>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedStageId(stage.id)
                    }
                    className={`w-full rounded-xl border p-4 text-left transition sm:p-5 ${
                      isSelected
                        ? `${severityStyle.borderClass} ${severityStyle.backgroundClass}`
                        : "border-slate-700 bg-slate-900/60 hover:border-slate-600 hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${severityStyle.iconBackgroundClass}`}
                      >
                        <stage.icon
                          className={`h-6 w-6 ${severityStyle.textClass}`}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                              Stage {index + 1}
                            </p>

                            <h3 className="mt-1 text-lg font-bold text-white">
                              {stage.title}
                            </h3>
                          </div>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${severityStyle.borderClass} ${severityStyle.backgroundClass} ${severityStyle.textClass}`}
                          >
                            {stage.status}
                          </span>
                        </div>

                        <p className="mt-2 font-medium text-slate-300">
                          {stage.subtitle}
                        </p>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          {stage.description}
                        </p>
                      </div>
                    </div>
                  </button>

                  {index <
                    attackStages.length - 1 && (
                    <div className="flex h-12 items-center justify-center">
                      <div className="flex flex-col items-center">
                        <div className="h-5 w-px bg-slate-700" />

                        <ArrowDown
                          className={`h-5 w-5 ${severityStyle.connectorClass}`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {selectedStage && (
          <StageDetails stage={selectedStage} />
        )}
      </div>

      <div className="mt-6 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
        <div className="flex items-start gap-3">
          <Bot className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />

          <div>
            <p className="text-sm font-semibold text-blue-200">
              SentinelAI interpretation
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-300">
              This chain is generated from the latest
              uploaded analysis. It represents the logical
              progression of the incident, not a guaranteed
              reconstruction of every attacker action.
              Analyst validation is required.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

type StageDetailsProps = {
  stage: AttackStage;
};

function StageDetails({
  stage,
}: StageDetailsProps) {
  const severityStyle = getSeverityStyle(
    stage.severity,
  );

  const Icon = stage.icon;

  return (
    <aside className="rounded-xl border border-slate-700 bg-slate-950/30 p-5">
      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${severityStyle.iconBackgroundClass}`}
        >
          <Icon
            className={`h-6 w-6 ${severityStyle.textClass}`}
          />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Selected stage
          </p>

          <h3 className="mt-1 text-xl font-bold text-white">
            {stage.title}
          </h3>

          <p
            className={`mt-2 text-sm font-semibold ${severityStyle.textClass}`}
          >
            {stage.subtitle}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-slate-700 bg-slate-900/60 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Analysis
        </p>

        <p className="mt-3 text-sm leading-7 text-slate-300">
          {stage.description}
        </p>
      </div>

      <div className="mt-6">
        <h4 className="flex items-center gap-2 font-semibold text-white">
          <CircleDot className="h-4 w-4 text-cyan-400" />
          Supporting Evidence
        </h4>

        <div className="mt-4 space-y-3">
          {stage.evidence.map(
            (evidence, index) => (
              <div
                key={`${stage.id}-${index}`}
                className="flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-900/60 p-4"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-xs font-bold text-cyan-300">
                  {index + 1}
                </div>

                <p className="text-sm leading-6 text-slate-300">
                  {evidence}
                </p>
              </div>
            ),
          )}
        </div>
      </div>

      <div
        className={`mt-6 rounded-lg border p-4 ${severityStyle.borderClass} ${severityStyle.backgroundClass}`}
      >
        <p
          className={`text-xs font-semibold uppercase tracking-[0.14em] ${severityStyle.textClass}`}
        >
          Stage classification
        </p>

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-sm text-slate-400">
            Status
          </span>

          <span className="font-semibold text-white">
            {stage.status}
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-sm text-slate-400">
            Severity
          </span>

          <span
            className={`font-semibold ${severityStyle.textClass}`}
          >
            {stage.severity}
          </span>
        </div>
      </div>
    </aside>
  );
}

type SummaryMetricProps = {
  label: string;
  value: number | string;
  valueClass: string;
};

function SummaryMetric({
  label,
  value,
  valueClass,
}: SummaryMetricProps) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/40 p-4">
      <p className="text-sm text-slate-400">
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-bold ${valueClass}`}
      >
        {typeof value === "number"
          ? value.toLocaleString()
          : value}
      </p>
    </div>
  );
}

function buildAttackStages(
  analysis: UploadResult,
): AttackStage[] {
  const stages: AttackStage[] = [];

  const sortedSuspiciousIps = [
    ...analysis.suspicious_ips,
  ].sort(
    (firstIp, secondIp) =>
      secondIp.attempts - firstIp.attempts,
  );

  const highestRiskIp =
    sortedSuspiciousIps[0];

  const sortedDetections = [
    ...analysis.detections,
  ].sort(
    (firstDetection, secondDetection) =>
      severityOrder[secondDetection.severity] -
      severityOrder[firstDetection.severity],
  );

  const primaryDetection =
    sortedDetections[0];

  const affectedUsers = Array.from(
    new Set(
      analysis.detections.flatMap(
        (detection) =>
          detection.affected_users ?? [],
      ),
    ),
  );

  if (highestRiskIp) {
    stages.push({
      id: "external-source",
      title: "External Source Activity",
      subtitle: highestRiskIp.ip,
      description:
        "SentinelAI identified a source address associated with repeated authentication activity.",
      status: "Observed",
      severity:
        highestRiskIp.attempts >= 20
          ? "Critical"
          : highestRiskIp.attempts >= 10
            ? "High"
            : highestRiskIp.attempts >= 4
              ? "Medium"
              : "Low",
      icon: Network,
      evidence: [
        `${highestRiskIp.ip} generated ${highestRiskIp.attempts.toLocaleString()} failed authentication attempt(s).`,
        `${analysis.suspicious_ips.length.toLocaleString()} suspicious source IP address(es) were identified overall.`,
      ],
    });
  }

  if (analysis.failed_logins > 0) {
    stages.push({
      id: "authentication-failures",
      title: "Authentication Failures",
      subtitle: `${analysis.failed_logins.toLocaleString()} failed login attempt(s)`,
      description:
        "Repeated failed authentication events indicate possible credential guessing, password spraying, user error, or misconfigured services.",
      status: "Observed",
      severity:
        analysis.failed_logins >= 20
          ? "Critical"
          : analysis.failed_logins >= 10
            ? "High"
            : analysis.failed_logins >= 4
              ? "Medium"
              : "Low",
      icon: KeyRound,
      evidence: [
        `${analysis.failed_logins.toLocaleString()} failed login attempt(s) were recorded.`,
        `${analysis.successful_logins.toLocaleString()} successful login attempt(s) were also present.`,
        `The uploaded source contained ${analysis.entries.toLocaleString()} total security events.`,
      ],
    });
  }

  if (affectedUsers.length > 0) {
    stages.push({
      id: "account-targeting",
      title: "Account Targeting",
      subtitle:
        affectedUsers.length === 1
          ? affectedUsers[0]
          : `${affectedUsers.length} affected accounts`,
      description:
        "The detected activity was associated with one or more user accounts that should be reviewed for unauthorized authentication attempts.",
      status: "Detected",
      severity:
        primaryDetection?.severity ?? "Medium",
      icon: UserRound,
      evidence: affectedUsers
        .slice(0, 6)
        .map(
          (user) =>
            `Account ${user} was associated with a mapped detection.`,
        ),
    });
  }

  if (primaryDetection) {
    stages.push({
      id: "detection-triggered",
      title: primaryDetection.type,
      subtitle: `${primaryDetection.confidence}% detection confidence`,
      description:
        primaryDetection.description ||
        "A SentinelAI detection rule matched the observed security activity.",
      status: "Detected",
      severity: primaryDetection.severity,
      icon: ShieldAlert,
      evidence: [
        `${analysis.detections.length.toLocaleString()} total detection(s) were generated.`,
        `${primaryDetection.event_count.toLocaleString()} event(s) contributed to this detection.`,
        primaryDetection.source_ip
          ? `The detection was associated with source IP ${primaryDetection.source_ip}.`
          : "No single source IP was attached to this detection.",
      ],
    });

    stages.push({
      id: "mitre-mapping",
      title: "MITRE ATT&CK Mapping",
      subtitle: primaryDetection.mitre_id,
      description: `${primaryDetection.type} was mapped to MITRE ATT&CK technique ${primaryDetection.mitre_id}, providing a standardized description of the observed adversary behavior.`,
      status: "Detected",
      severity: primaryDetection.severity,
      icon: Target,
      evidence: [
        `Technique ID: ${primaryDetection.mitre_id}`,
        `Detection type: ${primaryDetection.type}`,
        `Confidence: ${primaryDetection.confidence}%`,
      ],
    });
  }

  stages.push({
    id: "risk-assessment",
    title: "Incident Risk Assessment",
    subtitle: `${analysis.risk_level} · ${analysis.risk_score}/100`,
    description:
      "SentinelAI combined authentication failures, suspicious sources, alert severity, and detection context into an overall incident-priority score.",
    status: "Assessed",
    severity: getRiskSeverity(
      analysis.risk_level,
    ),
    icon: AlertTriangle,
    evidence: [
      `Overall risk score: ${analysis.risk_score}/100`,
      `Risk classification: ${analysis.risk_level}`,
      `Critical alerts: ${analysis.severity_summary.critical.toLocaleString()}`,
      `High alerts: ${analysis.severity_summary.high.toLocaleString()}`,
    ],
  });

  const firstRecommendation =
    analysis.detections
      .flatMap(
        (detection) =>
          detection.recommendations ?? [],
      )
      .find(
        (recommendation) =>
          recommendation.trim().length > 0,
      );

  stages.push({
    id: "analyst-response",
    title: "Analyst Response",
    subtitle: "Investigation recommended",
    description:
      firstRecommendation ??
      "Review the suspicious sources, validate targeted accounts, confirm whether successful authentication was authorized, and escalate confirmed malicious activity.",
    status: "Recommended",
    severity: getRiskSeverity(
      analysis.risk_level,
    ),
    icon: Bot,
    evidence: [
      highestRiskIp
        ? `Prioritize review of ${highestRiskIp.ip}.`
        : "Review all source addresses associated with authentication failures.",
      "Correlate successful logins with prior failed attempts.",
      "Preserve relevant logs and document analyst findings.",
      "Apply containment only after validating malicious activity.",
    ],
  });

  return stages;
}

export default AttackChainVisualization;
