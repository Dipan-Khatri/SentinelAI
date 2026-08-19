import {
  useState,
} from "react";

import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  CircleCheck,
  FileText,
  Gauge,
  Info,
  LoaderCircle,
  ShieldAlert,
  ShieldCheck,
  Upload,
} from "lucide-react";

import { useToast } from "../context/ToastContext";
import { addSocActivity } from "../services/activityFeed";

import {
  uploadLog,
  type Detection,
  type TimelineEvent,
  type UploadResult,
} from "../services/api";

const STORAGE_KEY =
  "sentinelai_latest_analysis";

const ALLOWED_EXTENSIONS = [
  ".log",
  ".txt",
  ".csv",
  ".json",
];

type FilePreview = {
  file: File;
  name: string;
  size: string;
  entries: number;
  lines: string[];
};

const severityStyles: Record<
  Detection["severity"],
  string
> = {
  Critical:
    "border-red-400 bg-red-500/20 text-red-200",

  High:
    "border-red-500/60 bg-red-500/15 text-red-300",

  Medium:
    "border-amber-500/60 bg-amber-500/15 text-amber-300",

  Low:
    "border-blue-500/60 bg-blue-500/15 text-blue-300",
};

const riskStyles: Record<
  UploadResult["risk_level"],
  string
> = {
  Critical:
    "border-red-500/40 bg-red-500/20 text-red-300",

  High:
    "border-orange-500/40 bg-orange-500/20 text-orange-300",

  Medium:
    "border-amber-500/40 bg-amber-500/20 text-amber-300",

  Low:
    "border-green-500/40 bg-green-500/20 text-green-300",
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

function UploadLogs() {
  const [preview, setPreview] =
    useState<FilePreview | null>(null);

  const [analysis, setAnalysis] =
    useState<UploadResult | null>(null);

  const [error, setError] =
    useState("");

  const [isAnalyzing, setIsAnalyzing] =
    useState(false);

  const { showToast } = useToast();

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];

    setError("");
    setPreview(null);
    setAnalysis(null);

    if (!file) {
      return;
    }

    const extension =
      getFileExtension(file.name);

    if (
      !ALLOWED_EXTENSIONS.includes(
        extension,
      )
    ) {
      const message =
        "Please upload a .log, .txt, .csv, or .json file.";

      setError(message);
      event.target.value = "";

      showToast({
        title:
          "Unsupported file type",
        message,
        type: "warning",
      });

      return;
    }

    try {
      const content =
        await file.text();

      const logLines = content
        .split(/\r?\n/)
        .filter(
          (line) =>
            line.trim() !== "",
        );

      if (logLines.length === 0) {
        const message =
          "The selected file does not contain any readable log entries.";

        setError(message);
        event.target.value = "";

        showToast({
          title: "Empty log file",
          message,
          type: "warning",
        });

        return;
      }

      setPreview({
        file,
        name: file.name,
        size: formatFileSize(
          file.size,
        ),
        entries: logLines.length,
        lines: logLines.slice(
          0,
          5,
        ),
      });

      showToast({
        title: "File ready",
        message:
          `${file.name} passed local validation with ${logLines.length.toLocaleString()} log entries.`,
        type: "success",
        duration: 2800,
      });
    } catch {
      const message =
        "SentinelAI could not read this file.";

      setError(message);

      showToast({
        title:
          "File reading failed",
        message,
        type: "error",
      });
    }
  }

  async function handleAnalyze() {
    if (!preview) {
      const message =
        "Select and validate a security log before starting analysis.";

      setError(message);

      showToast({
        title: "No log selected",
        message,
        type: "warning",
      });

      return;
    }

    setError("");
    setAnalysis(null);
    setIsAnalyzing(true);

    showToast({
      title: "Analysis started",
      message:
        `SentinelAI is analyzing ${preview.name}.`,
      type: "info",
      duration: 2200,
    });

    addSocActivity({
      title:
        "Security log analysis started",

      description:
        `${preview.name} was submitted for security analysis.`,

      category: "analysis",
      severity: "Info",
      filename: preview.name,
    });

    try {
      const rawResult =
        await uploadLog(
          preview.file,
        );

      const normalizedResult: UploadResult = {
        ...rawResult,

        filename: normalizeFilename(
          rawResult.filename,
          preview.name,
        ),
      };

      setAnalysis(
        normalizedResult,
      );
 localStorage.setItem(
  STORAGE_KEY,
  JSON.stringify(normalizedResult),
);

localStorage.setItem(
  "latestAnalysisId",
  String(
    normalizedResult.analysis_id ??
    normalizedResult.id
  ),
);
      

      addSocActivity({
        title:
          "Security log analysis completed",

        description:
          `SentinelAI analyzed ${normalizedResult.entries.toLocaleString()} events and assigned a ${normalizedResult.risk_level.toLowerCase()} risk score of ${normalizedResult.risk_score}/100.`,

        category: "analysis",

        severity:
          normalizedResult.detections
            .length > 0
            ? normalizedResult.risk_level
            : "Success",

        filename:
          normalizedResult.filename,
      });

      normalizedResult.detections.forEach(
        (detection) => {
          addSocActivity({
            title: detection.type,

            description:
              `${detection.description} Confidence: ${detection.confidence}%.`,

            category: "detection",

            severity:
              detection.severity,

            sourceIp:
              detection.source_ip ??
              undefined,

            filename:
              normalizedResult.filename,

            mitreId:
              detection.mitre_id,
          });
        },
      );

      if (
        normalizedResult.suspicious_ips
          .length > 0
      ) {
        const highestActivitySource =
          [
            ...normalizedResult.suspicious_ips,
          ].sort(
            (
              firstIp,
              secondIp,
            ) =>
              secondIp.attempts -
              firstIp.attempts,
          )[0];

        addSocActivity({
          title:
            "Suspicious source activity identified",

          description:
            `${normalizedResult.suspicious_ips.length.toLocaleString()} suspicious source IP ${
              normalizedResult
                .suspicious_ips.length === 1
                ? "was"
                : "addresses were"
            } identified. ${highestActivitySource.ip} produced the most activity with ${highestActivitySource.attempts.toLocaleString()} failed attempt${
              highestActivitySource
                .attempts === 1
                ? ""
                : "s"
            }.`,

          category:
            "threat-intelligence",

          severity:
            normalizedResult.risk_level,

          sourceIp:
            highestActivitySource.ip,

          filename:
            normalizedResult.filename,
        });
      }

      const detectionText =
        normalizedResult.detections
          .length === 1
          ? "1 detection"
          : `${normalizedResult.detections.length.toLocaleString()} detections`;

      showToast({
        title:
          "Analysis complete",

        message:
          `${normalizedResult.filename} was analyzed successfully with ${detectionText} and a ${normalizedResult.risk_level.toLowerCase()} risk score of ${normalizedResult.risk_score}/100.`,

        type: "success",
        duration: 5000,
      });
    } catch (errorValue) {
      const message =
        errorValue instanceof Error
          ? errorValue.message
          : "SentinelAI could not connect to the backend.";

      setError(message);

      addSocActivity({
        title:
          "Security log analysis failed",

        description:
          `${preview.name} could not be analyzed. ${message}`,

        category: "system",
        severity: "High",
        filename: preview.name,
      });

      showToast({
        title: "Analysis failed",
        message,
        type: "error",
        duration: 6000,
      });
    } finally {
      setIsAnalyzing(false);
    }
  }

  function resetUpload() {
    setPreview(null);
    setAnalysis(null);
    setError("");

    showToast({
      title: "Upload cleared",

      message:
        "You can now select another security log.",

      type: "info",
      duration: 2200,
    });
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 text-white sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
            SentinelAI Log Analysis
          </p>

          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            Upload Security Logs
          </h1>

          <p className="mt-2 max-w-3xl text-slate-400">
            Import authentication logs for validation,
            threat detection, risk scoring, and incident
            investigation.
          </p>
        </header>

        <label className="mt-8 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-600 bg-slate-800 px-6 py-14 text-center transition hover:border-blue-500 hover:bg-slate-800/80">
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
          <div className="mt-5 flex items-start gap-3 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-red-300">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />

            <p className="text-sm leading-6">
              {error}
            </p>
          </div>
        )}

        {preview && (
          <section className="mt-8 rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-lg">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="rounded-lg bg-blue-500/15 p-3">
                  <FileText className="h-7 w-7 text-blue-500" />
                </div>

                <div className="min-w-0">
                  <h2 className="break-all text-xl font-semibold">
                    {preview.name}
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    {preview.size}
                    {" · "}
                    {preview.entries.toLocaleString()} local entries
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={resetUpload}
                disabled={isAnalyzing}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-red-500 hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Clear File
              </button>
            </div>

            <div className="mt-6 rounded-lg border border-slate-800 bg-slate-950 p-4">
              <p className="mb-3 text-sm font-semibold text-slate-300">
                File preview
              </p>

              <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words text-sm leading-6 text-slate-400">
                {preview.lines.join("\n")}
              </pre>
            </div>

            <div className="mt-5 flex items-start gap-2 text-sm text-green-400">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />

              <span>
                File validated and ready for backend
                analysis
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                void handleAnalyze()
              }
              disabled={isAnalyzing}
              className="mt-6 flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAnalyzing ? (
                <>
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <ShieldAlert className="h-5 w-5" />
                  Analyze Logs
                </>
              )}
            </button>
          </section>
        )}

        {analysis && (
          <>
            <section className="mt-8 rounded-xl border border-green-500/30 bg-green-500/10 p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-7 w-7 shrink-0 text-green-400" />

                <div>
                  <h2 className="text-xl font-semibold">
                    Backend analysis complete
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-green-300">
                    SentinelAI successfully analyzed{" "}
                    <span className="font-semibold">
                      {analysis.filename}
                    </span>
                    .
                  </p>

                  {analysis.analysis_id && (
                    <p className="mt-1 text-xs text-green-400/80">
                      Analysis ID: #{analysis.analysis_id}
                      {analysis.saved_to_database
                        ? " · Saved to SQLite"
                        : ""}
                    </p>
                  )}
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
                  count={
                    analysis.severity_summary
                      .critical
                  }
                  className="text-red-300"
                />

                <SeverityCard
                  label="High"
                  count={
                    analysis.severity_summary
                      .high
                  }
                  className="text-orange-400"
                />

                <SeverityCard
                  label="Medium"
                  count={
                    analysis.severity_summary
                      .medium
                  }
                  className="text-amber-400"
                />

                <SeverityCard
                  label="Low"
                  count={
                    analysis.severity_summary
                      .low
                  }
                  className="text-blue-400"
                />
              </div>
            </section>

            <RiskScoreCard
              analysis={analysis}
            />

            {analysis.detections.length > 0 ? (
              <section className="mt-8 rounded-xl border border-red-500/40 bg-red-500/10 p-6">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="mt-0.5 h-8 w-8 shrink-0 text-red-400" />

                  <div>
                    <h2 className="text-2xl font-bold">
                      Threat Detections
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-red-300">
                      SentinelAI identified{" "}
                      {analysis.detections.length.toLocaleString()}{" "}
                      suspicious behavior
                      {analysis.detections.length === 1
                        ? " pattern."
                        : " patterns."}
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-5">
                  {analysis.detections.map(
                    (detection, index) => (
                      <DetectionCard
                        key={`${detection.id ?? detection.type}-${detection.source_ip ?? "unknown"}-${index}`}
                        detection={detection}
                        number={index + 1}
                      />
                    ),
                  )}
                </div>
              </section>
            ) : (
              <section className="mt-8 rounded-xl border border-green-500/30 bg-green-500/10 p-6">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-7 w-7 shrink-0 text-green-400" />

                  <div>
                    <h2 className="text-xl font-semibold">
                      No threats detected
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-green-300">
                      No activity matched the current
                      detection rules.
                    </p>
                  </div>
                </div>
              </section>
            )}

            <section className="mt-8 rounded-xl border border-slate-700 bg-slate-800 p-6">
              <h2 className="text-2xl font-bold">
                Investigation Timeline
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-400">
                Chronological authentication events and
                detection activity from the uploaded log.
              </p>

              {analysis.timeline.length > 0 ? (
                <div className="relative mt-8">
                  <div className="absolute bottom-0 left-5 top-0 w-px bg-slate-700" />

                  <div className="space-y-6">
                    {analysis.timeline.map(
                      (event, index) => (
                        <TimelineItem
                          key={`${event.id ?? event.line_number}-${index}`}
                          event={event}
                        />
                      ),
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-lg border border-slate-700 bg-slate-950/50 p-6 text-center">
                  <Info className="mx-auto h-8 w-8 text-slate-500" />

                  <p className="mt-3 font-medium text-slate-300">
                    No timeline events available
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    The analyzed log did not produce
                    timeline entries.
                  </p>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
type RiskScoreCardProps = {
  analysis: UploadResult;
};

function RiskScoreCard({
  analysis,
}: RiskScoreCardProps) {
  return (
    <section className="mt-8 rounded-xl border border-slate-700 bg-slate-800 p-6">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-blue-500/15 p-3">
            <Gauge className="h-7 w-7 text-blue-400" />
          </div>

          <div>
            <h2 className="text-2xl font-bold">
              Overall Risk Score
            </h2>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">
              Calculated from detection severity,
              confidence, suspicious-source activity, and
              authentication behavior.
            </p>
          </div>
        </div>

        <span
          className={`rounded-full border px-4 py-2 text-sm font-bold ${
            riskStyles[
              analysis.risk_level
            ]
          }`}
        >
          {analysis.risk_level} Risk
        </span>
      </div>

      <div className="mt-8 flex items-end gap-3">
        <p className="text-5xl font-bold">
          {analysis.risk_score}
        </p>

        <p className="pb-1 text-xl text-slate-400">
          / 100
        </p>
      </div>

      <div className="mt-5 h-4 overflow-hidden rounded-full bg-slate-950">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            riskBarStyles[
              analysis.risk_level
            ]
          }`}
          style={{
            width: `${Math.min(
              Math.max(
                analysis.risk_score,
                0,
              ),
              100,
            )}%`,
          }}
        />
      </div>

      <div className="mt-3 flex justify-between text-xs text-slate-500">
        <span>Low</span>
        <span>Medium</span>
        <span>High</span>
        <span>Critical</span>
      </div>
    </section>
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
    <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-4">
      <p className="text-sm text-slate-400">
        {title}
      </p>

      <p
        className={`mt-2 text-2xl font-bold ${valueClass}`}
      >
        {value.toLocaleString()}
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
      <p className="text-sm text-slate-400">
        {label}
      </p>

      <p
        className={`mt-2 text-xl font-bold ${className}`}
      >
        {count.toLocaleString()}
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
            severityStyles[
              detection.severity
            ]
          }`}
        >
          {detection.severity}
        </span>
      </div>

      <p className="mt-4 leading-7 text-slate-300">
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
          value={
            detection.source_ip ??
            "Not available"
          }
          valueClass="font-mono text-red-300"
        />

        <DetailCard
          label="Event count"
          value={detection.event_count.toLocaleString()}
        />
      </div>

      <div className="mt-5">
        <p className="text-sm font-semibold text-slate-300">
          Affected accounts
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {detection.affected_users.length >
          0 ? (
            detection.affected_users.map(
              (user) => (
                <span
                  key={user}
                  className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200"
                >
                  {user}
                </span>
              ),
            )
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

        {detection.recommendations.length >
        0 ? (
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
            {detection.recommendations.map(
              (recommendation) => (
                <li key={recommendation}>
                  {recommendation}
                </li>
              ),
            )}
          </ul>
        ) : (
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Review the related log evidence,
            correlate the source IP with other
            authentication events, and validate
            whether the activity was authorized.
          </p>
        )}
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
    <div className="min-w-0 rounded-lg border border-slate-800 bg-slate-900 p-4">
      <p className="text-sm text-slate-400">
        {label}
      </p>

      <p
        className={`mt-2 break-words font-semibold ${valueClass}`}
      >
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
  const timelineStyle =
    getTimelineStyle(event.event_type);

  const TimelineIcon =
    timelineStyle.icon;

  return (
    <article className="relative flex gap-5">
      <div
        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${timelineStyle.circle}`}
      >
        <TimelineIcon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950/60 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="break-words text-xs uppercase tracking-wide text-slate-500">
              {event.timestamp}
            </p>

            <h3 className="mt-1 break-words text-lg font-semibold">
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

        {event.invalid_user && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300">
            <AlertTriangle className="h-4 w-4" />
            Invalid account targeted
          </div>
        )}

        {event.raw && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-blue-400 transition hover:text-blue-300">
              View raw log evidence
            </summary>

            <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-slate-800 bg-slate-900 p-4 text-xs leading-6 text-slate-400">
              {event.raw}
            </pre>
          </details>
        )}
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
    <div className="min-w-0 rounded-lg border border-slate-800 bg-slate-900/60 p-3">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p
        className={`mt-1 break-words text-sm font-semibold ${className}`}
      >
        {value}
      </p>
    </div>
  );
}

function getTimelineStyle(
  eventType:
    TimelineEvent["event_type"],
) {
  switch (eventType) {
    case "failed_login":
      return {
        icon: CircleAlert,
        circle:
          "border-red-500/50 bg-red-500/20 text-red-400",
        badge:
          "bg-red-500/20 text-red-300",
      };

    case "successful_login":
      return {
        icon: CircleCheck,
        circle:
          "border-green-500/50 bg-green-500/20 text-green-400",
        badge:
          "bg-green-500/20 text-green-300",
      };

    case "detection":
      return {
        icon: ShieldAlert,
        circle:
          "border-amber-500/50 bg-amber-500/20 text-amber-400",
        badge:
          "bg-amber-500/20 text-amber-300",
      };

    default:
      return {
        icon: Info,
        circle:
          "border-blue-500/50 bg-blue-500/20 text-blue-400",
        badge:
          "bg-blue-500/20 text-blue-300",
      };
  }
}

function normalizeFilename(
  backendFilename: string,
  originalFilename: string,
): string {
  const cleanBackendName =
    backendFilename.trim();

  const cleanOriginalName =
    originalFilename.trim();

  if (!cleanBackendName) {
    return cleanOriginalName;
  }

  const backendLower =
    cleanBackendName.toLowerCase();

  const originalLower =
    cleanOriginalName.toLowerCase();

  if (
    backendLower ===
    `${originalLower}.log`
  ) {
    return cleanOriginalName;
  }

  const duplicateExtensionPattern =
    /(\.(?:log|txt|csv|json))\1$/i;

  if (
    duplicateExtensionPattern.test(
      cleanBackendName,
    )
  ) {
    return cleanBackendName.replace(
      duplicateExtensionPattern,
      "$1",
    );
  }

  return cleanBackendName;
}

function getFileExtension(
  filename: string,
): string {
  const lastDotIndex =
    filename.lastIndexOf(".");

  if (lastDotIndex === -1) {
    return "";
  }

  return filename
    .slice(lastDotIndex)
    .toLowerCase();
}

function formatFileSize(
  sizeInBytes: number,
): string {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  }

  const sizeInKilobytes =
    sizeInBytes / 1024;

  if (sizeInKilobytes < 1024) {
    return `${sizeInKilobytes.toFixed(
      2,
    )} KB`;
  }

  const sizeInMegabytes =
    sizeInKilobytes / 1024;

  return `${sizeInMegabytes.toFixed(
    2,
  )} MB`;
}

export default UploadLogs;

