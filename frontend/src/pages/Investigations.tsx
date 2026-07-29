import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  FileText,
  Network,
  Save,
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
const INVESTIGATION_STORAGE_KEY = "sentinelai_investigation_state";

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

function Investigations() {
  const [analysis, setAnalysis] = useState<UploadResult | null>(null);
  const [selectedDetectionIndex, setSelectedDetectionIndex] =
    useState(0);
  const [status, setStatus] =
    useState<InvestigationStatus>("Open");
  const [notes, setNotes] = useState("");
  const [completedActions, setCompletedActions] = useState<string[]>(
    [],
  );
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    const savedAnalysis = localStorage.getItem(
      ANALYSIS_STORAGE_KEY,
    );

    if (savedAnalysis) {
      try {
        const parsedAnalysis = JSON.parse(
          savedAnalysis,
        ) as UploadResult;

        setAnalysis(parsedAnalysis);
      } catch {
        localStorage.removeItem(ANALYSIS_STORAGE_KEY);
      }
    }

    const savedInvestigation = localStorage.getItem(
      INVESTIGATION_STORAGE_KEY,
    );

    if (savedInvestigation) {
      try {
        const parsedState = JSON.parse(
          savedInvestigation,
        ) as SavedInvestigationState;

        setSelectedDetectionIndex(
          parsedState.selectedDetectionIndex ?? 0,
        );
        setStatus(parsedState.status ?? "Open");
        setNotes(parsedState.notes ?? "");
        setCompletedActions(parsedState.completedActions ?? []);
      } catch {
        localStorage.removeItem(INVESTIGATION_STORAGE_KEY);
      }
    }
  }, []);

  const selectedDetection = useMemo(() => {
    if (!analysis || analysis.detections.length === 0) {
      return null;
    }

    return (
      analysis.detections[selectedDetectionIndex] ??
      analysis.detections[0]
    );
  }, [analysis, selectedDetectionIndex]);

  const relatedTimeline = useMemo(() => {
    if (!analysis || !selectedDetection) {
      return [];
    }

    return analysis.timeline.filter((event) => {
      if (
        selectedDetection.source_ip &&
        event.ip === selectedDetection.source_ip
      ) {
        return true;
      }

      return selectedDetection.affected_users.some(
        (user) => event.user?.includes(user),
      );
    });
  }, [analysis, selectedDetection]);

  function selectDetection(index: number) {
    setSelectedDetectionIndex(index);
    setStatus("Open");
    setNotes("");
    setCompletedActions([]);
    setSaveMessage("");
  }

  function toggleAction(action: string) {
    setCompletedActions((currentActions) => {
      if (currentActions.includes(action)) {
        return currentActions.filter(
          (currentAction) => currentAction !== action,
        );
      }

      return [...currentActions, action];
    });

    setSaveMessage("");
  }

  function saveInvestigation() {
    const state: SavedInvestigationState = {
      selectedDetectionIndex,
      status,
      notes,
      completedActions,
    };

    localStorage.setItem(
      INVESTIGATION_STORAGE_KEY,
      JSON.stringify(state),
    );

    setSaveMessage("Investigation saved successfully.");
  }

  function resolveInvestigation() {
    const resolvedState: SavedInvestigationState = {
      selectedDetectionIndex,
      status: "Resolved",
      notes,
      completedActions,
    };

    setStatus("Resolved");

    localStorage.setItem(
      INVESTIGATION_STORAGE_KEY,
      JSON.stringify(resolvedState),
    );

    setSaveMessage("Investigation marked as resolved.");
  }

  if (!analysis) {
    return <EmptyInvestigation />;
  }

  if (!selectedDetection) {
    return <NoDetections />;
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Link
                to="/"
                className="transition hover:text-blue-400"
              >
                Dashboard
              </Link>

              <ChevronRight className="h-4 w-4" />

              <span>Investigations</span>
            </div>

            <h1 className="mt-3 text-4xl font-bold">
              Investigation Workspace
            </h1>

            <p className="mt-2 text-slate-400">
              Review evidence, document analyst findings, and track
              response actions.
            </p>
          </div>

          <Link
            to="/"
            className="flex items-center gap-2 rounded-lg border border-slate-600 px-5 py-3 font-medium text-slate-200 transition hover:border-blue-500 hover:text-blue-400"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Dashboard
          </Link>
        </header>

        <section className="mt-8 grid gap-6 xl:grid-cols-[360px_1fr]">
          <aside className="rounded-xl border border-slate-700 bg-slate-800 p-5">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-6 w-6 text-red-400" />

              <div>
                <h2 className="text-xl font-bold">
                  Detection Queue
                </h2>

                <p className="text-sm text-slate-400">
                  {analysis.detections.length} detection(s)
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {analysis.detections.map((detection, index) => {
                const isSelected =
                  selectedDetectionIndex === index;

                return (
                  <button
                    key={`${detection.type}-${detection.source_ip}-${index}`}
                    type="button"
                    onClick={() => selectDetection(index)}
                    className={`w-full rounded-lg border p-4 text-left transition ${
                      isSelected
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-slate-700 bg-slate-950/50 hover:border-slate-500"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-slate-500">
                          Detection #{index + 1}
                        </p>

                        <h3 className="mt-1 font-semibold text-white">
                          {detection.type}
                        </h3>
                      </div>

                      <span
                        className={`rounded-full border px-2 py-1 text-xs font-semibold ${
                          severityStyles[detection.severity]
                        }`}
                      >
                        {detection.severity}
                      </span>
                    </div>

                    <p className="mt-3 font-mono text-sm text-red-300">
                      {detection.source_ip ?? "Unknown source"}
                    </p>

                    <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                      <span>{detection.mitre_id}</span>

                      <span>
                        {detection.confidence}% confidence
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <main className="space-y-6">
            <section className="rounded-xl border border-slate-700 bg-slate-800 p-6">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <p className="text-sm text-slate-500">
                    Active investigation
                  </p>

                  <h2 className="mt-1 text-3xl font-bold">
                    {selectedDetection.type}
                  </h2>

                  <p className="mt-3 max-w-3xl text-slate-300">
                    {selectedDetection.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <span
                    className={`rounded-full border px-4 py-2 text-sm font-bold ${
                      severityStyles[selectedDetection.severity]
                    }`}
                  >
                    {selectedDetection.severity}
                  </span>

                  <span
                    className={`rounded-full border px-4 py-2 text-sm font-bold ${
                      statusStyles[status]
                    }`}
                  >
                    {status}
                  </span>
                </div>
              </div>

              <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <EvidenceMetric
                  icon={Network}
                  label="Source IP"
                  value={
                    selectedDetection.source_ip ?? "Not available"
                  }
                  valueClass="font-mono text-red-300"
                />

                <EvidenceMetric
                  icon={Target}
                  label="MITRE ATT&CK"
                  value={selectedDetection.mitre_id}
                  valueClass="text-blue-400"
                />

                <EvidenceMetric
                  icon={CircleDot}
                  label="Confidence"
                  value={`${selectedDetection.confidence}%`}
                  valueClass="text-green-400"
                />

                <EvidenceMetric
                  icon={FileText}
                  label="Related Events"
                  value={String(selectedDetection.event_count)}
                />
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
                <div className="flex items-center gap-3">
                  <UserRound className="h-6 w-6 text-purple-400" />

                  <div>
                    <h2 className="text-xl font-bold">
                      Affected Accounts
                    </h2>

                    <p className="text-sm text-slate-400">
                      Accounts associated with this detection.
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {selectedDetection.affected_users.length > 0 ? (
                    selectedDetection.affected_users.map((user) => (
                      <span
                        key={user}
                        className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-2 font-medium text-purple-300"
                      >
                        {user}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">
                      No affected account was identified.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
                <div className="flex items-center gap-3">
                  <Clock3 className="h-6 w-6 text-blue-400" />

                  <div>
                    <h2 className="text-xl font-bold">
                      Investigation Status
                    </h2>

                    <p className="text-sm text-slate-400">
                      Update the current investigation state.
                    </p>
                  </div>
                </div>

                <select
                  value={status}
                  onChange={(event) => {
                    setStatus(
                      event.target.value as InvestigationStatus,
                    );
                    setSaveMessage("");
                  }}
                  className="mt-5 w-full rounded-lg border border-slate-600 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="False Positive">
                    False Positive
                  </option>
                </select>
              </div>
            </section>

            <section className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-7 w-7 text-amber-400" />

                <div>
                  <h2 className="text-xl font-bold text-amber-300">
                    Recommended Response Actions
                  </h2>

                  <p className="text-sm text-slate-400">
                    Mark each action as it is completed.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {selectedDetection.recommendations.map(
                  (recommendation) => {
                    const isCompleted =
                      completedActions.includes(recommendation);

                    return (
                      <label
                        key={recommendation}
                        className={`flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition ${
                          isCompleted
                            ? "border-green-500/30 bg-green-500/10"
                            : "border-slate-700 bg-slate-950/40 hover:border-slate-500"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isCompleted}
                          onChange={() =>
                            toggleAction(recommendation)
                          }
                          className="mt-1 h-4 w-4 accent-green-500"
                        />

                        <div>
                          <p
                            className={
                              isCompleted
                                ? "text-green-300 line-through"
                                : "text-slate-200"
                            }
                          >
                            {recommendation}
                          </p>

                          {isCompleted && (
                            <p className="mt-1 text-xs text-green-400">
                              Completed
                            </p>
                          )}
                        </div>
                      </label>
                    );
                  },
                )}
              </div>
            </section>

            <section className="rounded-xl border border-slate-700 bg-slate-800 p-6">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-blue-400" />

                <div>
                  <h2 className="text-xl font-bold">
                    Analyst Notes
                  </h2>

                  <p className="text-sm text-slate-400">
                    Document findings, decisions, and response
                    activity.
                  </p>
                </div>
              </div>

              <textarea
                value={notes}
                onChange={(event) => {
                  setNotes(event.target.value);
                  setSaveMessage("");
                }}
                placeholder="Example: Reviewed the source IP and confirmed repeated failed SSH authentication attempts against the test account..."
                rows={7}
                className="mt-5 w-full resize-y rounded-lg border border-slate-600 bg-slate-950 p-4 text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-blue-500"
              />

              <p className="mt-2 text-right text-xs text-slate-500">
                {notes.length} characters
              </p>
            </section>

            <section className="rounded-xl border border-slate-700 bg-slate-800 p-6">
              <div className="flex items-center gap-3">
                <Clock3 className="h-6 w-6 text-blue-400" />

                <div>
                  <h2 className="text-xl font-bold">
                    Related Evidence Timeline
                  </h2>

                  <p className="text-sm text-slate-400">
                    Events connected to the source IP or affected
                    accounts.
                  </p>
                </div>
              </div>

              <div className="relative mt-7">
                <div className="absolute bottom-0 left-5 top-0 w-px bg-slate-700" />

                <div className="space-y-5">
                  {relatedTimeline.length > 0 ? (
                    relatedTimeline.map((event, index) => (
                      <EvidenceTimelineItem
                        key={`${event.line_number}-${index}`}
                        event={event}
                      />
                    ))
                  ) : (
                    <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-5 text-sm text-slate-400">
                      No directly related timeline events were found.
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-700 bg-slate-800 p-6">
              <div>
                {saveMessage ? (
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>{saveMessage}</span>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">
                    Save your notes, status, and completed actions
                    before leaving.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={saveInvestigation}
                  className="flex items-center gap-2 rounded-lg border border-blue-500 px-5 py-3 font-medium text-blue-400 transition hover:bg-blue-500/10"
                >
                  <Save className="h-5 w-5" />
                  Save Investigation
                </button>

                <button
                  type="button"
                  onClick={resolveInvestigation}
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-3 font-medium text-white transition hover:bg-green-700"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  Resolve Investigation
                </button>
              </div>
            </section>
          </main>
        </section>
      </div>
    </div>
  );
}

type EvidenceMetricProps = {
  icon: typeof Network;
  label: string;
  value: string;
  valueClass?: string;
};

function EvidenceMetric({
  icon: Icon,
  label,
  value,
  valueClass = "text-white",
}: EvidenceMetricProps) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-400" />

        <p className="text-sm text-slate-400">{label}</p>
      </div>

      <p
        className={`mt-3 break-words font-semibold ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}

type EvidenceTimelineItemProps = {
  event: TimelineEvent;
};

function EvidenceTimelineItem({
  event,
}: EvidenceTimelineItemProps) {
  const isFailed = event.event_type === "failed_login";
  const isSuccessful =
    event.event_type === "successful_login";
  const isDetection = event.event_type === "detection";

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
        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${circleStyle}`}
      >
        <CircleDot className="h-5 w-5" />
      </div>

      <div className="flex-1 rounded-lg border border-slate-700 bg-slate-950/50 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {event.timestamp}
            </p>

            <h3 className="mt-1 font-semibold">
              {event.title}
            </h3>
          </div>

          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
            {event.status}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {event.ip && (
            <span>
              <span className="text-slate-500">IP: </span>

              <span className="font-mono text-red-300">
                {event.ip}
              </span>
            </span>
          )}

          {event.user && (
            <span>
              <span className="text-slate-500">User: </span>

              <span className="text-slate-200">
                {event.user}
              </span>
            </span>
          )}

          {event.method && (
            <span>
              <span className="text-slate-500">Method: </span>

              <span className="text-slate-200">
                {event.method}
              </span>
            </span>
          )}
        </div>

        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-blue-400 hover:text-blue-300">
            View raw evidence
          </summary>

          <pre className="mt-3 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-900 p-4 text-xs text-slate-400">
            {event.raw}
          </pre>
        </details>
      </div>
    </article>
  );
}

function EmptyInvestigation() {
  return (
    <div className="min-h-screen bg-slate-900 p-8 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold">
          Investigations
        </h1>

        <section className="mt-10 rounded-xl border border-dashed border-slate-600 bg-slate-800 p-12 text-center">
          <ShieldAlert className="mx-auto h-14 w-14 text-blue-400" />

          <h2 className="mt-5 text-2xl font-bold">
            No analysis available
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-slate-400">
            Upload and analyze a security log before starting an
            investigation.
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

function NoDetections() {
  return (
    <div className="min-h-screen bg-slate-900 p-8 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold">
          Investigations
        </h1>

        <section className="mt-10 rounded-xl border border-green-500/30 bg-green-500/10 p-12 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-green-400" />

          <h2 className="mt-5 text-2xl font-bold">
            No threats require investigation
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-green-300">
            The latest analysis did not generate any security
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

export default Investigations;
