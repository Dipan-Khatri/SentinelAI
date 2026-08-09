import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  ExternalLink,
  ShieldAlert,
  UserRound,
} from "lucide-react";

import { Link } from "react-router-dom";

import type {
  Investigation,
  UploadResult,
} from "../../services/api";

type LatestIncidentsProps = {
  analysis: UploadResult;
  investigations: Investigation[];
};

type IncidentRow = {
  id: string;
  title: string;
  severity: string;
  status: string;
  analyst: string;
  sourceIp: string;
  confidence: number;
  mitreId: string;
  updatedAt: string;
  investigationId: number | null;
};

function LatestIncidents({
  analysis,
  investigations,
}: LatestIncidentsProps) {
  const incidents =
    buildIncidentRows(
      analysis,
      investigations,
    ).slice(0, 6);

  return (
    <section className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-700 p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
            Incident Operations
          </p>

          <h2 className="mt-2 text-2xl font-bold text-white">
            Latest Incidents
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Prioritized detections with investigation
            status, analyst ownership, MITRE ATT&CK
            mapping, source IP, confidence, and latest
            activity.
          </p>
        </div>

        <Link
          to="/cases"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-blue-500 hover:text-blue-300"
        >
          View Case Queue
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {incidents.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-950/70">
              <tr className="border-b border-slate-700 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-5 py-4 font-semibold">
                  Incident
                </th>

                <th className="px-5 py-4 font-semibold">
                  Severity
                </th>

                <th className="px-5 py-4 font-semibold">
                  Status
                </th>

                <th className="px-5 py-4 font-semibold">
                  Analyst
                </th>

                <th className="hidden px-5 py-4 font-semibold xl:table-cell">
                  Source IP
                </th>

                <th className="hidden px-5 py-4 font-semibold 2xl:table-cell">
                  Confidence
                </th>

                <th className="hidden px-5 py-4 font-semibold 2xl:table-cell">
                  Updated
                </th>

                <th className="px-5 py-4 text-right font-semibold">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-700">
              {incidents.map(
                (incident) => (
                  <tr
                    key={incident.id}
                    className="bg-slate-900/30 transition hover:bg-slate-700/40"
                  >
                    <td className="px-5 py-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                        {incident.id}
                      </p>

                      <p className="mt-1 max-w-[220px] font-semibold text-white">
                        {incident.title}
                      </p>

                      <p className="mt-1 font-mono text-xs text-slate-500">
                        {incident.mitreId}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getSeverityClass(
                          incident.severity,
                        )}`}
                      >
                        {incident.severity}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge
                        status={
                          incident.status
                        }
                      />
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <UserRound className="h-4 w-4 shrink-0 text-slate-500" />

                        <span className="whitespace-nowrap">
                          {incident.analyst}
                        </span>
                      </div>
                    </td>

                    <td className="hidden px-5 py-4 font-mono text-sm text-orange-300 xl:table-cell">
                      {incident.sourceIp}
                    </td>

                    <td className="hidden px-5 py-4 2xl:table-cell">
                      <div className="min-w-[110px]">
                        <span className="text-sm font-semibold text-green-300">
                          {incident.confidence}%
                        </span>

                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-950">
                          <div
                            className="h-full rounded-full bg-green-500 transition-all duration-700"
                            style={{
                              width: `${incident.confidence}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="hidden whitespace-nowrap px-5 py-4 text-sm text-slate-400 2xl:table-cell">
                      {incident.updatedAt}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <Link
                        to="/investigations"
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                      >
                        Open
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-10 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-400" />

          <h3 className="mt-4 text-lg font-semibold text-white">
            No incidents detected
          </h3>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
            The active analysis did not generate any
            security detections requiring investigation.
          </p>
        </div>
      )}
    </section>
  );
}

function buildIncidentRows(
  analysis: UploadResult,
  investigations: Investigation[],
): IncidentRow[] {
  const severityOrder: Record<
    string,
    number
  > = {
    Critical: 4,
    High: 3,
    Medium: 2,
    Low: 1,
  };

  return analysis.detections
    .map(
      (
        detection,
        index,
      ) => {
        const detectionMatch =
          investigations.find(
            (investigation) =>
              investigation.detection_id ===
              detection.id,
          );

        const analysisMatches =
          investigations.filter(
            (investigation) =>
              investigation.analysis_id ===
              analysis.analysis_id,
          );

        const matchingInvestigation =
          detectionMatch ??
          analysisMatches[index] ??
          null;

        return {
          id: matchingInvestigation
            ? `INC-${String(
                matchingInvestigation.id,
              ).padStart(4, "0")}`
            : `INC-${String(
                index + 1,
              ).padStart(4, "0")}`,

          title: detection.type,

          severity:
            detection.severity,

          status:
            matchingInvestigation?.status ??
            "Unassigned",

          analyst:
            matchingInvestigation?.analyst?.trim() ||
            "Unassigned",

          sourceIp:
            detection.source_ip ??
            "Unavailable",

          confidence:
            detection.confidence?? 0, 

          mitreId:
            detection.mitre_id,

          updatedAt:
            formatRelativeTime(
              matchingInvestigation?.updated_at,
            ),

          investigationId:
            matchingInvestigation?.id ??
            null,
        };
      },
    )
    .sort(
      (
        firstIncident,
        secondIncident,
      ) =>
        (severityOrder[
          secondIncident.severity
        ] ?? 0) -
        (severityOrder[
          firstIncident.severity
        ] ?? 0),
    );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const configuration =
    getStatusConfiguration(
      status,
    );

  const Icon =
    configuration.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold ${configuration.className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {status}
    </span>
  );
}

function getStatusConfiguration(
  status: string,
) {
  switch (
    status.toLowerCase()
  ) {
    case "resolved":
      return {
        icon: CheckCircle2,
        className:
          "border-green-500/40 bg-green-500/15 text-green-300",
      };

    case "in progress":
      return {
        icon: Clock3,
        className:
          "border-amber-500/40 bg-amber-500/15 text-amber-300",
      };

    case "open":
      return {
        icon: ShieldAlert,
        className:
          "border-red-500/40 bg-red-500/15 text-red-300",
      };

    case "false positive":
      return {
        icon: CheckCircle2,
        className:
          "border-slate-500/40 bg-slate-500/15 text-slate-300",
      };

    default:
      return {
        icon: AlertTriangle,
        className:
          "border-blue-500/40 bg-blue-500/15 text-blue-300",
      };
  }
}

function getSeverityClass(
  severity: string,
) {
  switch (
    severity.toLowerCase()
  ) {
    case "critical":
      return "border-red-500/40 bg-red-500/15 text-red-300";

    case "high":
      return "border-orange-500/40 bg-orange-500/15 text-orange-300";

    case "medium":
      return "border-amber-500/40 bg-amber-500/15 text-amber-300";

    default:
      return "border-blue-500/40 bg-blue-500/15 text-blue-300";
  }
}

function formatRelativeTime(
  timestamp?: string | null,
) {
  if (!timestamp) {
    return "Not saved";
  }

  const date =
    new Date(timestamp);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return timestamp;
  }

  const difference =
    Date.now() -
    date.getTime();

  const minutes =
    Math.floor(
      difference / 60_000,
    );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours =
    Math.floor(
      minutes / 60,
    );

  if (hours < 24) {
    return `${hours} hr ago`;
  }

  const days =
    Math.floor(
      hours / 24,
    );

  return `${days} day${
    days === 1
      ? ""
      : "s"
  } ago`;
}

export default LatestIncidents;
