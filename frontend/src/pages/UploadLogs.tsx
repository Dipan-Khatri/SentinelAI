import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  CircleCheck,
  FileText,
  Info,
  LoaderCircle,
  ShieldAlert,
  ShieldCheck,
  Upload,
} from "lucide-react";

import {
  uploadLog,
  type Detection,
  type TimelineEvent,
  type UploadResult,
} from "../services/api";

type FilePreview = {
  file: File;
  name: string;
  size: string;
  entries: number;
  lines: string[];
};

const severityStyles: Record<Detection["severity"], string> = {
  Critical: "border-red-400 bg-red-500/20 text-red-200",
  High: "border-red-500/60 bg-red-500/15 text-red-300",
  Medium: "border-amber-500/60 bg-amber-500/15 text-amber-300",
  Low: "border-blue-500/60 bg-blue-500/15 text-blue-300",
};

function UploadLogs() {
  const [preview, setPreview] = useState<FilePreview | null>(null);
  const [analysis, setAnalysis] = useState<UploadResult | null>(null);
  const [error, setError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    setError("");
    setPreview(null);
    setAnalysis(null);

    if (!file) return;

    const allowedExtensions = [".log", ".txt", ".csv", ".json"];

    const extension = file.name
      .slice(file.name.lastIndexOf("."))
      .toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      setError("Please upload a .log, .txt, .csv, or .json file.");
      event.target.value = "";
      return;
    }

    try {
      const content = await file.text();

      const logLines = content
        .split(/\r?\n/)
        .filter((line) => line.trim() !== "");

      setPreview({
        file,
        name: file.name,
        size: `${(file.size / 1024).toFixed(2)} KB`,
        entries: logLines.length,
        lines: logLines.slice(0, 5),
      });
    } catch {
      setError("SentinelAI could not read this file.");
    }
  }

  async function handleAnalyze() {
    if (!preview) return;

    setError("");
    setAnalysis(null);
    setIsAnalyzing(true);

    try {
      const result = await uploadLog(preview.file);
      setAnalysis(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "SentinelAI could not connect to the backend.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold">Upload Security Logs</h1>

        <p className="mt-2 text-slate-400">
          Import authentication logs for validation, threat detection,
          and investigation.
        </p>

        <label className="mt-8 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-600 bg-slate-800 px-6 py-14 transition hover:border-blue-500 hover:bg-slate-800/80">
          <Upload className="mb-4 h-10 w-10 text-blue-500" />

          <span className="text-lg font-semibold">
            Select a security log file
          </span>

          <span className="mt-2 text-sm text-slate-400">
            Supported formats: LOG, TXT, CSV, and JSON
          </span>

          <input
            type="file"
            accept=".log,.txt,.csv,.json"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {error && (
          <div className="mt-5 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}

        {preview && (
          <section className="mt-8 rounded-xl bg-slate-800 p-6 shadow-lg">
            <div className="flex items-center gap-3">
              <FileText className="h-7 w-7 text-blue-500" />

              <div>
                <h2 className="text-xl font-semibold">{preview.name}</h2>

                <p className="text-sm text-slate-400">
                  {preview.size} · {preview.entries} local entries
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-lg bg-slate-950 p-4">
              <p className="mb-3 text-sm font-semibold text-slate-300">
                File preview
              </p>

              <pre className="max-h-56 overflow-auto whitespace-pre-wrap text-sm text-slate-400">
                {preview.lines.join("\n") || "The file is empty."}
              </pre>
            </div>

            <div className="mt-5 flex items-center gap-2 text-sm text-green-400">
              <ShieldCheck className="h-5 w-5" />
              File validated and ready for backend analysis
            </div>

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="mt-6 flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAnalyzing ? (
                <>
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Analyze Logs"
              )}
            </button>
          </section>
        )}

        {analysis && (
          <>
            <section className="mt-8 rounded-xl border border-green-500/30 bg-green-500/10 p-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-7 w-7 text-green-400" />

                <div>
                  <h2 className="text-xl font-semibold">
                    Backend analysis complete
                  </h2>

                  <p className="mt-1 text-sm text-green-300">
                    SentinelAI successfully analyzed {analysis.filename}.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  title="Log entries"
                  value={analysis.entries}
                />

                <MetricCard
                  title="Failed logins"
                  value={analysis.failed_logins}
                  valueClass="text-orange-400"
                />

                <MetricCard
                  title="Successful logins"
                  value={analysis.successful_logins}
                  valueClass="text-green-400"
                />

                <MetricCard
                  title="Detections"
                  value={analysis.detections.length}
                  valueClass="text-red-400"
                />
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <SeverityCard
                  label="Critical"
                  count={analysis.severity_summary.critical}
                  className="text-red-300"
                />

                <SeverityCard
                  label="High"
                  count={analysis.severity_summary.high}
                  className="text-red-400"
                />

                <SeverityCard
                  label="Medium"
                  count={analysis.severity_summary.medium}
                  className="text-amber-400"
                />

                <SeverityCard
                  label="Low"
                  count={analysis.severity_summary.low}
                  className="text-blue-400"
                />
              </div>
            </section>

            {analysis.detections.length > 0 ? (
              <section className="mt-8 rounded-xl border border-red-500/40 bg-red-500/10 p-6">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="h-8 w-8 text-red-400" />

                  <div>
                    <h2 className="text-2xl font-bold">
                      Threat Detections
                    </h2>

                    <p className="text-sm text-red-300">
                      SentinelAI identified{" "}
                      {analysis.detections.length} suspicious behavior
                      pattern(s).
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-5">
                  {analysis.detections.map((detection, index) => (
                    <DetectionCard
                      key={`${detection.type}-${detection.source_ip}-${index}`}
                      detection={detection}
                      number={index + 1}
                    />
                  ))}
                </div>
              </section>
            ) : (
              <section className="mt-8 rounded-xl border border-green-500/30 bg-green-500/10 p-6">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-7 w-7 text-green-400" />

                  <div>
                    <h2 className="text-xl font-semibold">
                      No threats detected
                    </h2>

                    <p className="text-sm text-green-300">
                      No activity matched the current detection rules.
                    </p>
                  </div>
                </div>
              </section>
            )}

            <section className="mt-8 rounded-xl border border-slate-700 bg-slate-800 p-6">
              <div>
                <h2 className="text-2xl font-bold">
                  Investigation Timeline
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Chronological authentication events and detection
                  activity.
                </p>
              </div>

              <div className="relative mt-8">
                <div className="absolute bottom-0 left-5 top-0 w-px bg-slate-700" />

                <div className="space-y-6">
                  {analysis.timeline.map((event, index) => (
                    <TimelineItem
                      key={`${event.line_number}-${index}`}
                      event={event}
                    />
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

type MetricCardProps = {
  title: string;
  value: number;
  valueClass?: string;
};

function MetricCard({
  title,
  value,
  valueClass = "text-white",
}: MetricCardProps) {
  return (
    <div className="rounded-lg bg-slate-950/60 p-4">
      <p className="text-sm text-slate-400">{title}</p>

      <p className={`mt-1 text-2xl font-bold ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

type SeverityCardProps = {
  label: string;
  count: number;
  className: string;
};

function SeverityCard({
  label,
  count,
  className,
}: SeverityCardProps) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-4">
      <p className="text-sm text-slate-400">{label}</p>

      <p className={`mt-1 text-xl font-bold ${className}`}>
        {count}
      </p>
    </div>
  );
}

type DetectionCardProps = {
  detection: Detection;
  number: number;
};

function DetectionCard({
  detection,
  number,
}: DetectionCardProps) {
  return (
    <article className="rounded-xl border border-slate-700 bg-slate-950/70 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">
            Detection #{number}
          </p>

          <h3 className="mt-1 text-xl font-bold">
            {detection.type}
          </h3>
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-sm font-semibold ${
            severityStyles[detection.severity]
          }`}
        >
          {detection.severity}
        </span>
      </div>

      <p className="mt-4 text-slate-300">
        {detection.description}
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DetailCard
          label="MITRE ATT&CK"
          value={detection.mitre_id}
          valueClass="text-blue-400"
        />

        <DetailCard
          label="Confidence"
          value={`${detection.confidence}%`}
          valueClass="text-green-400"
        />

        <DetailCard
          label="Source IP"
          value={detection.source_ip ?? "Not available"}
          valueClass="font-mono text-red-300"
        />

        <DetailCard
          label="Event count"
          value={String(detection.event_count)}
        />
      </div>

      <div className="mt-5">
        <p className="text-sm font-semibold text-slate-300">
          Affected accounts
        </p>

        <div className="mt-2 flex flex-wrap gap-2">
          {detection.affected_users.length > 0 ? (
            detection.affected_users.map((user) => (
              <span
                key={user}
                className="rounded-md bg-slate-800 px-3 py-1 text-sm text-slate-200"
              >
                {user}
              </span>
            ))
          ) : (
            <span className="text-sm text-slate-500">
              No account identified
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-400" />

          <h4 className="font-semibold text-amber-300">
            Recommended actions
          </h4>
        </div>

        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-300">
          {detection.recommendations.map((recommendation) => (
            <li key={recommendation}>{recommendation}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}

type DetailCardProps = {
  label: string;
  value: string;
  valueClass?: string;
};

function DetailCard({
  label,
  value,
  valueClass = "text-white",
}: DetailCardProps) {
  return (
    <div className="rounded-lg bg-slate-900 p-4">
      <p className="text-sm text-slate-400">{label}</p>

      <p className={`mt-1 break-words font-semibold ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

type TimelineItemProps = {
  event: TimelineEvent;
};

function TimelineItem({
  event,
}: TimelineItemProps) {
  const timelineStyle = getTimelineStyle(event.event_type);
  const TimelineIcon = timelineStyle.icon;

  return (
    <article className="relative flex gap-5">
      <div
        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${timelineStyle.circle}`}
      >
        <TimelineIcon className="h-5 w-5" />
      </div>

      <div className="flex-1 rounded-xl border border-slate-700 bg-slate-950/60 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {event.timestamp}
            </p>

            <h3 className="mt-1 text-lg font-semibold">
              {event.title}
            </h3>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${timelineStyle.badge}`}
          >
            {event.status}
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {event.user && (
            <TimelineDetail
              label="User"
              value={event.user}
            />
          )}

          {event.ip && (
            <TimelineDetail
              label="Source IP"
              value={event.ip}
              className="font-mono text-red-300"
            />
          )}

          {event.method && (
            <TimelineDetail
              label="Authentication"
              value={event.method}
            />
          )}
        </div>

        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-blue-400 hover:text-blue-300">
            View raw log evidence
          </summary>

          <pre className="mt-3 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-900 p-4 text-xs text-slate-400">
            {event.raw}
          </pre>
        </details>
      </div>
    </article>
  );
}

type TimelineDetailProps = {
  label: string;
  value: string;
  className?: string;
};

function TimelineDetail({
  label,
  value,
  className = "text-white",
}: TimelineDetailProps) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>

      <p className={`mt-1 text-sm font-semibold ${className}`}>
        {value}
      </p>
    </div>
  );
}

function getTimelineStyle(
  eventType: TimelineEvent["event_type"],
) {
  switch (eventType) {
    case "failed_login":
      return {
        icon: CircleAlert,
        circle:
          "border-red-500/50 bg-red-500/20 text-red-400",
        badge: "bg-red-500/20 text-red-300",
      };

    case "successful_login":
      return {
        icon: CircleCheck,
        circle:
          "border-green-500/50 bg-green-500/20 text-green-400",
        badge: "bg-green-500/20 text-green-300",
      };

    case "detection":
      return {
        icon: ShieldAlert,
        circle:
          "border-amber-500/50 bg-amber-500/20 text-amber-400",
        badge: "bg-amber-500/20 text-amber-300",
      };

    default:
      return {
        icon: Info,
        circle:
          "border-blue-500/50 bg-blue-500/20 text-blue-400",
        badge: "bg-blue-500/20 text-blue-300",
      };
  }
}

export default UploadLogs;
