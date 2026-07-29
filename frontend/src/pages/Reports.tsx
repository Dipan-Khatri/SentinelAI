import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  FileSearch,
  FileText,
  Network,
  Printer,
  ShieldAlert,
  Target,
  UserRound,
} from "lucide-react";

import type {
  Detection,
  TimelineEvent,
  UploadResult,
} from "../services/api";

const ANALYSIS_STORAGE_KEY = "sentinelai_latest_analysis";
const INVESTIGATION_STORAGE_KEY =
  "sentinelai_investigation_state";

type InvestigationStatus =
  | "Open"
  | "In Progress"
  | "Resolved"
  | "False Positive";

type SavedInvestigationState = {
  selectedDetectionIndex: number;
  status: InvestigationStatus;
  notes: string;
  completedActions: string[];
};

const severityStyles: Record<Detection["severity"], string> = {
  Critical: "border-red-500/40 bg-red-500/15 text-red-300",
  High: "border-orange-500/40 bg-orange-500/15 text-orange-300",
  Medium: "border-amber-500/40 bg-amber-500/15 text-amber-300",
  Low: "border-blue-500/40 bg-blue-500/15 text-blue-300",
};

const statusStyles: Record<InvestigationStatus, string> = {
  Open: "border-red-500/40 bg-red-500/15 text-red-300",
  "In Progress":
    "border-amber-500/40 bg-amber-500/15 text-amber-300",
  Resolved:
    "border-green-500/40 bg-green-500/15 text-green-300",
  "False Positive":
    "border-slate-500/40 bg-slate-500/15 text-slate-300",
};

function Reports() {
  const [analysis, setAnalysis] = useState<UploadResult | null>(null);
  const [investigation, setInvestigation] =
    useState<SavedInvestigationState | null>(null);

  useEffect(() => {
    const savedAnalysis = localStorage.getItem(
      ANALYSIS_STORAGE_KEY,
    );

    if (savedAnalysis) {
      try {
        setAnalysis(
          JSON.parse(savedAnalysis) as UploadResult,
        );
      } catch {
        localStorage.removeItem(ANALYSIS_STORAGE_KEY);
      }
    }

    const savedInvestigation = localStorage.getItem(
      INVESTIGATION_STORAGE_KEY,
    );

    if (savedInvestigation) {
      try {
        setInvestigation(
          JSON.parse(
            savedInvestigation,
          ) as SavedInvestigationState,
        );
      } catch {
        localStorage.removeItem(
          INVESTIGATION_STORAGE_KEY,
        );
      }
    }
  }, []);

  const selectedDetection = useMemo(() => {
    if (!analysis || analysis.detections.length === 0) {
      return null;
    }

    const selectedIndex =
      investigation?.selectedDetectionIndex ?? 0;

    return (
      analysis.detections[selectedIndex] ??
      analysis.detections[0]
    );
  }, [analysis, investigation]);

  const relatedTimeline = useMemo(() => {
    if (!analysis || !selectedDetection) {
      return [];
    }

    return analysis.timeline.filter((event) => {
      const sourceMatches =
        selectedDetection.source_ip &&
        event.ip === selectedDetection.source_ip;

      const userMatches =
        selectedDetection.affected_users.some(
          (user) => event.user?.includes(user),
        );

      return sourceMatches || userMatches;
    });
  }, [analysis, selectedDetection]);

  const reportId = useMemo(() => {
    if (!analysis || !selectedDetection) {
      return "SENTINEL-UNAVAILABLE";
    }

    const sourcePart = selectedDetection.source_ip
      ?.replaceAll(".", "")
      .slice(-6);

    return `SENTINEL-${analysis.entries}-${
      sourcePart || "UNKNOWN"
    }`;
  }, [analysis, selectedDetection]);

  const generatedDate = useMemo(() => {
    return new Date().toLocaleString();
  }, []);

  function printReport() {
    window.print();
  }

  function downloadTextReport() {
    if (!analysis || !selectedDetection) {
      return;
    }

    const status = investigation?.status ?? "Open";
    const notes =
      investigation?.notes.trim() ||
      "No analyst notes were recorded.";

    const completedActions =
      investigation?.completedActions ?? [];

    const reportText = [
      "SENTINELAI INCIDENT REPORT",
      "========================================",
      "",
      `Report ID: ${reportId}`,
      `Generated: ${generatedDate}`,
      `Source File: ${analysis.filename}`,
      "",
      "INCIDENT SUMMARY",
      "----------------------------------------",
      `Title: ${selectedDetection.type}`,
      `Severity: ${selectedDetection.severity}`,
      `Status: ${status}`,
      `Risk Score: ${analysis.risk_score}/100`,
      `Risk Level: ${analysis.risk_level}`,
      `Confidence: ${selectedDetection.confidence}%`,
      "",
      "TECHNICAL DETAILS",
      "----------------------------------------",
      `Source IP: ${
        selectedDetection.source_ip ?? "Not available"
      }`,
      `MITRE ATT&CK: ${selectedDetection.mitre_id}`,
      `Event Count: ${selectedDetection.event_count}`,
      `Affected Users: ${
        selectedDetection.affected_users.join(", ") ||
        "None identified"
      }`,
      "",
      "DETECTION DESCRIPTION",
      "----------------------------------------",
      selectedDetection.description,
      "",
      "RECOMMENDED ACTIONS",
      "----------------------------------------",
      ...selectedDetection.recommendations.map(
        (recommendation, index) => {
          const completed =
            completedActions.includes(recommendation);

          return `${index + 1}. [${completed ? "COMPLETED" : "PENDING"}] ${recommendation}`;
        },
      ),
      "",
      "ANALYST NOTES",
      "----------------------------------------",
      notes,
      "",
      "RELATED EVIDENCE",
      "----------------------------------------",
      ...relatedTimeline.map(
        (event, index) =>
          `${index + 1}. ${event.timestamp} | ${event.title} | ${event.status}\n` +
          `   IP: ${event.ip ?? "N/A"} | User: ${
            event.user ?? "N/A"
          } | Method: ${event.method ?? "N/A"}\n` +
          `   Raw: ${event.raw}`,
      ),
      "",
      "ANALYSIS SUMMARY",
      "----------------------------------------",
      `Log Entries: ${analysis.entries}`,
      `Failed Logins: ${analysis.failed_logins}`,
      `Successful Logins: ${analysis.successful_logins}`,
      `Total Detections: ${analysis.detections.length}`,
      `Suspicious IPs: ${analysis.suspicious_ips.length}`,
      "",
      "Generated by SentinelAI",
    ].join("\n");

    const blob = new Blob([reportText], {
      type: "text/plain;charset=utf-8",
    });

    const downloadUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");

    downloadLink.href = downloadUrl;
    downloadLink.download = `${reportId}-incident-report.txt`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();

    URL.revokeObjectURL(downloadUrl);
  }

  if (!analysis) {
    return <EmptyReport />;
  }

  if (!selectedDetection) {
    return <NoDetectionsReport />;
  }

  const investigationStatus =
    investigation?.status ?? "Open";

  const analystNotes =
    investigation?.notes.trim() ||
    "No analyst notes have been recorded for this investigation.";

  const completedActions =
    investigation?.completedActions ?? [];

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="print-hidden flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Link
                to="/"
                className="transition hover:text-blue-400"
              >
                Dashboard
              </Link>

              <ChevronRight className="h-4 w-4" />

              <span>Reports</span>
            </div>

            <h1 className="mt-3 text-4xl font-bold">
              Incident Report
            </h1>

            <p className="mt-2 text-slate-400">
              Review, print, or download the generated SentinelAI
              incident report.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/investigations"
              className="flex items-center gap-2 rounded-lg border border-slate-600 px-5 py-3 font-medium text-slate-200 transition hover:border-blue-500 hover:text-blue-400"
            >
              <ArrowLeft className="h-5 w-5" />
              Investigation
            </Link>

            <button
              type="button"
              onClick={downloadTextReport}
              className="flex items-center gap-2 rounded-lg border border-blue-500 px-5 py-3 font-medium text-blue-400 transition hover:bg-blue-500/10"
            >
              <Download className="h-5 w-5" />
              Download Report
            </button>

            <button
              type="button"
              onClick={printReport}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium transition hover:bg-blue-700"
            >
              <Printer className="h-5 w-5" />
              Print / Save PDF
            </button>
          </div>
        </header>

        <main
          id="incident-report"
          className="mt-8 rounded-xl border border-slate-700 bg-slate-800 shadow-xl print:mt-0 print:border-0 print:bg-white print:text-black print:shadow-none"
        >
          <section className="border-b border-slate-700 bg-gradient-to-r from-blue-950/70 to-slate-800 p-8 print:border-slate-300 print:bg-white">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-blue-500/15 p-4 print:border print:border-slate-300 print:bg-white">
                  <ShieldAlert className="h-10 w-10 text-blue-400 print:text-black" />
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400 print:text-slate-600">
                    SentinelAI
                  </p>

                  <h2 className="mt-1 text-3xl font-bold">
                    Security Incident Report
                  </h2>

                  <p className="mt-2 text-slate-400 print:text-slate-600">
                    Automated detection and analyst investigation
                    summary
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <p className="text-sm text-slate-400 print:text-slate-600">
                  Report ID
                </p>

                <p className="mt-1 font-mono font-semibold">
                  {reportId}
                </p>

                <p className="mt-3 text-sm text-slate-400 print:text-slate-600">
                  Generated
                </p>

                <p className="mt-1 text-sm">
                  {generatedDate}
                </p>
              </div>
            </div>
          </section>

          <div className="space-y-8 p-8">
            <section>
              <SectionHeading
                icon={ShieldAlert}
                title="Executive Summary"
                description="High-level overview of the detected security incident."
              />

              <div className="mt-5 rounded-xl border border-slate-700 bg-slate-950/50 p-6 print:border-slate-300 print:bg-white">
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div>
                    <p className="text-sm text-slate-400 print:text-slate-600">
                      Incident title
                    </p>

                    <h3 className="mt-1 text-2xl font-bold">
                      {selectedDetection.type}
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <span
                      className={`rounded-full border px-4 py-2 text-sm font-bold ${
                        severityStyles[
                          selectedDetection.severity
                        ]
                      }`}
                    >
                      {selectedDetection.severity}
                    </span>

                    <span
                      className={`rounded-full border px-4 py-2 text-sm font-bold ${
                        statusStyles[investigationStatus]
                      }`}
                    >
                      {investigationStatus}
                    </span>
                  </div>
                </div>

                <p className="mt-5 leading-7 text-slate-300 print:text-slate-700">
                  {selectedDetection.description}
                </p>
              </div>
            </section>

            <section>
              <SectionHeading
                icon={FileSearch}
                title="Incident Details"
                description="Technical indicators and risk information associated with the incident."
              />

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <ReportMetric
                  label="Overall Risk"
                  value={`${analysis.risk_score}/100`}
                  valueClass="text-orange-300 print:text-black"
                />

                <ReportMetric
                  label="Risk Level"
                  value={analysis.risk_level}
                  valueClass="text-orange-300 print:text-black"
                />

                <ReportMetric
                  label="Confidence"
                  value={`${selectedDetection.confidence}%`}
                  valueClass="text-green-400 print:text-black"
                />

                <ReportMetric
                  label="Related Events"
                  value={String(
                    selectedDetection.event_count,
                  )}
                />
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <ReportMetric
                  icon={Network}
                  label="Source IP"
                  value={
                    selectedDetection.source_ip ??
                    "Not available"
                  }
                  valueClass="font-mono text-red-300 print:text-black"
                />

                <ReportMetric
                  icon={Target}
                  label="MITRE ATT&CK"
                  value={selectedDetection.mitre_id}
                  valueClass="text-blue-400 print:text-black"
                />

                <ReportMetric
                  icon={FileText}
                  label="Source File"
                  value={analysis.filename}
                />
              </div>
            </section>

            <section>
              <SectionHeading
                icon={UserRound}
                title="Affected Accounts"
                description="User accounts associated with the detected behavior."
              />

              <div className="mt-5 flex flex-wrap gap-3">
                {selectedDetection.affected_users.length >
                0 ? (
                  selectedDetection.affected_users.map(
                    (user) => (
                      <span
                        key={user}
                        className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-2 font-medium text-purple-300 print:border-slate-300 print:bg-white print:text-black"
                      >
                        {user}
                      </span>
                    ),
                  )
                ) : (
                  <p className="text-sm text-slate-400 print:text-slate-600">
                    No affected accounts were identified.
                  </p>
                )}
              </div>
            </section>

            <section>
              <SectionHeading
                icon={AlertTriangle}
                title="Response Actions"
                description="Recommended containment and investigation actions."
              />

              <div className="mt-5 space-y-3">
                {selectedDetection.recommendations.map(
                  (recommendation, index) => {
                    const completed =
                      completedActions.includes(
                        recommendation,
                      );

                    return (
                      <div
                        key={recommendation}
                        className={`flex items-start gap-4 rounded-lg border p-4 ${
                          completed
                            ? "border-green-500/30 bg-green-500/10"
                            : "border-slate-700 bg-slate-950/40"
                        } print:border-slate-300 print:bg-white`}
                      >
                        <div
                          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                            completed
                              ? "bg-green-500/20 text-green-400"
                              : "bg-slate-700 text-slate-300"
                          } print:border print:border-slate-400 print:bg-white print:text-black`}
                        >
                          {completed ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <span className="text-xs font-bold">
                              {index + 1}
                            </span>
                          )}
                        </div>

                        <div>
                          <p
                            className={
                              completed
                                ? "text-green-300 print:text-black"
                                : "text-slate-200 print:text-black"
                            }
                          >
                            {recommendation}
                          </p>

                          <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                            {completed
                              ? "Completed"
                              : "Pending"}
                          </p>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </section>

            <section>
              <SectionHeading
                icon={FileText}
                title="Analyst Notes"
                description="Documented analyst findings and investigation decisions."
              />

              <div className="mt-5 min-h-32 whitespace-pre-wrap rounded-xl border border-slate-700 bg-slate-950/50 p-5 leading-7 text-slate-300 print:border-slate-300 print:bg-white print:text-black">
                {analystNotes}
              </div>
            </section>

            <section>
              <SectionHeading
                icon={Clock3}
                title="Evidence Timeline"
                description="Authentication and detection events related to this incident."
              />

              <div className="relative mt-6">
                <div className="absolute bottom-0 left-5 top-0 w-px bg-slate-700 print:bg-slate-300" />

                <div className="space-y-5">
                  {relatedTimeline.length > 0 ? (
                    relatedTimeline.map(
                      (event, index) => (
                        <ReportTimelineEvent
                          key={`${event.line_number}-${index}`}
                          event={event}
                        />
                      ),
                    )
                  ) : (
                    <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-5 text-slate-400 print:border-slate-300 print:bg-white print:text-slate-600">
                      No directly related evidence events were
                      found.
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section>
              <SectionHeading
                icon={FileSearch}
                title="Log Analysis Summary"
                description="Summary of the complete uploaded security log."
              />

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <ReportMetric
                  label="Log Entries"
                  value={String(analysis.entries)}
                />

                <ReportMetric
                  label="Failed Logins"
                  value={String(
                    analysis.failed_logins,
                  )}
                  valueClass="text-orange-300 print:text-black"
                />

                <ReportMetric
                  label="Successful Logins"
                  value={String(
                    analysis.successful_logins,
                  )}
                  valueClass="text-green-400 print:text-black"
                />

                <ReportMetric
                  label="Total Detections"
                  value={String(
                    analysis.detections.length,
                  )}
                  valueClass="text-red-300 print:text-black"
                />
              </div>
            </section>

            <footer className="border-t border-slate-700 pt-6 text-center text-sm text-slate-500 print:border-slate-300">
              Generated by SentinelAI · AI-Powered Security
              Operations Platform
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}

type SectionHeadingProps = {
  icon: typeof ShieldAlert;
  title: string;
  description: string;
};

function SectionHeading({
  icon: Icon,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-lg bg-blue-500/15 p-3 print:border print:border-slate-300 print:bg-white">
        <Icon className="h-6 w-6 text-blue-400 print:text-black" />
      </div>

      <div>
        <h3 className="text-xl font-bold">
          {title}
        </h3>

        <p className="mt-1 text-sm text-slate-400 print:text-slate-600">
          {description}
        </p>
      </div>
    </div>
  );
}

type ReportMetricProps = {
  icon?: typeof Network;
  label: string;
  value: string;
  valueClass?: string;
};

function ReportMetric({
  icon: Icon,
  label,
  value,
  valueClass = "text-white print:text-black",
}: ReportMetricProps) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-4 print:border-slate-300 print:bg-white">
      <div className="flex items-center gap-2">
        {Icon && (
          <Icon className="h-4 w-4 text-slate-400 print:text-slate-600" />
        )}

        <p className="text-sm text-slate-400 print:text-slate-600">
          {label}
        </p>
      </div>

      <p
        className={`mt-2 break-words font-semibold ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}

type ReportTimelineEventProps = {
  event: TimelineEvent;
};

function ReportTimelineEvent({
  event,
}: ReportTimelineEventProps) {
  const isFailed =
    event.event_type === "failed_login";
  const isSuccessful =
    event.event_type === "successful_login";
  const isDetection =
    event.event_type === "detection";

  const circleStyle = isFailed
    ? "border-red-500/40 bg-red-500/20 text-red-400"
    : isSuccessful
      ? "border-green-500/40 bg-green-500/20 text-green-400"
      : isDetection
        ? "border-amber-500/40 bg-amber-500/20 text-amber-400"
        : "border-blue-500/40 bg-blue-500/20 text-blue-400";

  return (
    <article className="relative flex gap-5">
      <div
        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${circleStyle} print:border-slate-400 print:bg-white print:text-black`}
      >
        <Clock3 className="h-5 w-5" />
      </div>

      <div className="flex-1 rounded-lg border border-slate-700 bg-slate-950/50 p-5 print:border-slate-300 print:bg-white">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {event.timestamp}
            </p>

            <h4 className="mt-1 font-semibold">
              {event.title}
            </h4>
          </div>

          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300 print:border print:border-slate-300 print:bg-white print:text-black">
            {event.status}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {event.ip && (
            <span>
              <span className="text-slate-500">
                IP:{" "}
              </span>

              <span className="font-mono text-red-300 print:text-black">
                {event.ip}
              </span>
            </span>
          )}

          {event.user && (
            <span>
              <span className="text-slate-500">
                User:{" "}
              </span>

              <span className="text-slate-200 print:text-black">
                {event.user}
              </span>
            </span>
          )}

          {event.method && (
            <span>
              <span className="text-slate-500">
                Method:{" "}
              </span>

              <span className="text-slate-200 print:text-black">
                {event.method}
              </span>
            </span>
          )}
        </div>

        <details className="mt-4 print:block">
          <summary className="cursor-pointer text-sm text-blue-400 print:hidden">
            View raw log evidence
          </summary>

          <div className="mt-3 hidden print:block">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Raw evidence
            </p>
          </div>

          <pre className="mt-3 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-900 p-4 text-xs text-slate-400 print:overflow-visible print:border print:border-slate-300 print:bg-white print:text-black">
            {event.raw}
          </pre>
        </details>
      </div>
    </article>
  );
}

function EmptyReport() {
  return (
    <div className="min-h-screen bg-slate-900 p-8 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold">
          Reports
        </h1>

        <section className="mt-10 rounded-xl border border-dashed border-slate-600 bg-slate-800 p-12 text-center">
          <FileText className="mx-auto h-14 w-14 text-blue-400" />

          <h2 className="mt-5 text-2xl font-bold">
            No report data available
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-slate-400">
            Analyze a security log and begin an investigation before
            generating an incident report.
          </p>

          <Link
            to="/upload"
            className="mt-7 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium transition hover:bg-blue-700"
          >
            Upload Security Logs
            <ChevronRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </div>
  );
}

function NoDetectionsReport() {
  return (
    <div className="min-h-screen bg-slate-900 p-8 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold">
          Reports
        </h1>

        <section className="mt-10 rounded-xl border border-green-500/30 bg-green-500/10 p-12 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-green-400" />

          <h2 className="mt-5 text-2xl font-bold">
            No incident report required
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-green-300">
            The latest log analysis did not produce any security
            detections.
          </p>

          <Link
            to="/"
            className="mt-7 inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-3 font-medium transition hover:bg-green-700"
          >
            Return to Dashboard
            <ChevronRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </div>
  );
}

export default Reports;
