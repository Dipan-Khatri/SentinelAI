import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock3,
  Radio,
  ShieldAlert,
  ShieldCheck,
  Wifi,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type { UploadResult } from "../../services/api";

type LiveEventFeedProps = {
  analysis: UploadResult;
};

type EventSeverity =
  | "Critical"
  | "High"
  | "Medium"
  | "Low"
  | "Info"
  | "Success";

type LiveEvent = {
  id: string;
  timestamp: Date;
  title: string;
  description: string;
  severity: EventSeverity;
  source?: string;
  icon: typeof Activity;
};

type SeverityStyle = {
  textClass: string;
  backgroundClass: string;
  borderClass: string;
  dotClass: string;
};

function getSeverityStyle(
  severity: EventSeverity,
): SeverityStyle {
  if (severity === "Critical") {
    return {
      textClass: "text-red-300",
      backgroundClass: "bg-red-500/10",
      borderClass: "border-red-500/30",
      dotClass: "bg-red-500",
    };
  }

  if (severity === "High") {
    return {
      textClass: "text-orange-300",
      backgroundClass: "bg-orange-500/10",
      borderClass: "border-orange-500/30",
      dotClass: "bg-orange-500",
    };
  }

  if (severity === "Medium") {
    return {
      textClass: "text-amber-300",
      backgroundClass: "bg-amber-500/10",
      borderClass: "border-amber-500/30",
      dotClass: "bg-amber-500",
    };
  }

  if (severity === "Low") {
    return {
      textClass: "text-green-300",
      backgroundClass: "bg-green-500/10",
      borderClass: "border-green-500/30",
      dotClass: "bg-green-500",
    };
  }

  if (severity === "Success") {
    return {
      textClass: "text-emerald-300",
      backgroundClass: "bg-emerald-500/10",
      borderClass: "border-emerald-500/30",
      dotClass: "bg-emerald-500",
    };
  }

  return {
    textClass: "text-blue-300",
    backgroundClass: "bg-blue-500/10",
    borderClass: "border-blue-500/30",
    dotClass: "bg-blue-500",
  };
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function createBaseEvents(
  analysis: UploadResult,
): LiveEvent[] {
  const now = Date.now();

  const events: LiveEvent[] = [
    {
      id: "analysis-complete",
      timestamp: new Date(now - 70_000),
      title: "Security analysis completed",
      description: `${analysis.entries.toLocaleString()} events were processed from ${analysis.filename}.`,
      severity: "Info",
      icon: CheckCircle2,
    },
    {
      id: "risk-score",
      timestamp: new Date(now - 58_000),
      title: "Risk score recalculated",
      description: `SentinelAI assigned a ${analysis.risk_level.toLowerCase()} risk level with a score of ${analysis.risk_score}/100.`,
      severity:
        analysis.risk_level === "Critical"
          ? "Critical"
          : analysis.risk_level === "High"
            ? "High"
            : analysis.risk_level === "Medium"
              ? "Medium"
              : "Low",
      icon: ShieldAlert,
    },
    {
      id: "failed-logins",
      timestamp: new Date(now - 46_000),
      title: "Failed authentication activity observed",
      description: `${analysis.failed_logins.toLocaleString()} failed login attempt(s) were identified.`,
      severity:
        analysis.failed_logins >= 10
          ? "High"
          : analysis.failed_logins >= 4
            ? "Medium"
            : "Low",
      icon: AlertTriangle,
    },
  ];

  const suspiciousIpEvents = [...analysis.suspicious_ips]
    .sort(
      (firstIp, secondIp) =>
        secondIp.attempts - firstIp.attempts,
    )
    .slice(0, 3)
    .map<LiveEvent>((item, index) => ({
      id: `suspicious-ip-${item.ip}`,
      timestamp: new Date(now - 36_000 + index * 6_000),
      title: "Suspicious source identified",
      description: `${item.ip} generated ${item.attempts.toLocaleString()} failed authentication attempt(s).`,
      severity:
        item.attempts >= 20
          ? "Critical"
          : item.attempts >= 10
            ? "High"
            : item.attempts >= 4
              ? "Medium"
              : "Low",
      source: item.ip,
      icon: Wifi,
    }));

  const detectionEvents = analysis.detections
    .slice(0, 3)
    .map<LiveEvent>((detection, index) => ({
      id: `detection-${detection.mitre_id}-${index}`,
      timestamp: new Date(now - 18_000 + index * 5_000),
      title: detection.type,
      description: `${detection.mitre_id} detected with ${detection.confidence}% confidence.`,
      severity: detection.severity,
      icon: ShieldAlert,
    }));

  const finalEvent: LiveEvent = {
    id: "ai-summary",
    timestamp: new Date(now - 2_000),
    title: "AI incident summary updated",
    description:
      "SentinelAI generated an analyst-focused explanation and recommended response workflow.",
    severity: "Info",
    icon: Bot,
  };

  return [
    ...events,
    ...suspiciousIpEvents,
    ...detectionEvents,
    finalEvent,
  ].sort(
    (firstEvent, secondEvent) =>
      secondEvent.timestamp.getTime() -
      firstEvent.timestamp.getTime(),
  );
}

function LiveEventFeed({
  analysis,
}: LiveEventFeedProps) {
  const baseEvents = useMemo(
    () => createBaseEvents(analysis),
    [analysis],
  );

  const [events, setEvents] =
    useState<LiveEvent[]>(baseEvents);

  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    setEvents(baseEvents);
  }, [baseEvents]);

  useEffect(() => {
    if (!isLive) {
      return;
    }

    const interval = window.setInterval(() => {
      const newestEvent = createSimulatedEvent(
        analysis,
      );

      setEvents((currentEvents) => [
        newestEvent,
        ...currentEvents,
      ].slice(0, 12));
    }, 8_000);

    return () => {
      window.clearInterval(interval);
    };
  }, [analysis, isLive]);

  const criticalEvents = events.filter(
    (event) => event.severity === "Critical",
  ).length;

  const highEvents = events.filter(
    (event) => event.severity === "High",
  ).length;

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-green-500/15 p-3">
            <Radio className="h-7 w-7 text-green-400" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-white">
                Live Security Event Feed
              </h2>

              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                  isLive
                    ? "border-green-500/30 bg-green-500/10 text-green-300"
                    : "border-slate-600 bg-slate-700/40 text-slate-400"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isLive
                      ? "animate-pulse bg-green-400"
                      : "bg-slate-500"
                  }`}
                />

                {isLive ? "Live" : "Paused"}
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-400">
              Streaming security activity from the latest
              SentinelAI analysis.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            setIsLive((currentValue) => !currentValue)
          }
          className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
            isLive
              ? "border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
              : "border-green-500/30 bg-green-500/10 text-green-300 hover:bg-green-500/20"
          }`}
        >
          {isLive ? "Pause Feed" : "Resume Feed"}
        </button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <FeedSummaryCard
          label="Visible Events"
          value={events.length}
          icon={Activity}
          valueClass="text-blue-300"
        />

        <FeedSummaryCard
          label="Critical Events"
          value={criticalEvents}
          icon={ShieldAlert}
          valueClass="text-red-300"
        />

        <FeedSummaryCard
          label="High Events"
          value={highEvents}
          icon={AlertTriangle}
          valueClass="text-orange-300"
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-700 bg-slate-950/40">
        <div className="flex items-center justify-between border-b border-slate-700 bg-slate-900/70 px-4 py-3">
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-slate-400" />

            <p className="text-sm font-semibold text-slate-300">
              Recent activity
            </p>
          </div>

          <p className="text-xs text-slate-500">
            Latest first
          </p>
        </div>

        <div className="max-h-[520px] divide-y divide-slate-800 overflow-y-auto">
          {events.map((event) => (
            <EventRow
              key={`${event.id}-${event.timestamp.getTime()}`}
              event={event}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />

          <div>
            <p className="text-sm font-semibold text-blue-200">
              Simulation mode
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-300">
              This feed currently simulates live updates
              using real analysis values. Later, we can
              replace the timer with a WebSocket connection
              while keeping this same interface.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

type EventRowProps = {
  event: LiveEvent;
};

function EventRow({ event }: EventRowProps) {
  const severityStyle = getSeverityStyle(
    event.severity,
  );

  const Icon = event.icon;

  return (
    <div className="grid gap-3 px-4 py-4 transition hover:bg-slate-900/60 sm:grid-cols-[92px_40px_1fr_auto] sm:items-center">
      <div className="font-mono text-xs text-slate-500">
        {formatTime(event.timestamp)}
      </div>

      <div
        className={`flex h-9 w-9 items-center justify-center rounded-full ${severityStyle.backgroundClass}`}
      >
        <Icon
          className={`h-4 w-4 ${severityStyle.textClass}`}
        />
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-white">
            {event.title}
          </p>

          {event.source && (
            <span className="rounded bg-slate-900 px-2 py-0.5 font-mono text-xs text-blue-300">
              {event.source}
            </span>
          )}
        </div>

        <p className="mt-1 text-sm leading-6 text-slate-400">
          {event.description}
        </p>
      </div>

      <span
        className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${severityStyle.textClass} ${severityStyle.backgroundClass} ${severityStyle.borderClass}`}
      >
        {event.severity}
      </span>
    </div>
  );
}

type FeedSummaryCardProps = {
  label: string;
  value: number;
  icon: typeof Activity;
  valueClass: string;
};

function FeedSummaryCard({
  label,
  value,
  icon: Icon,
  valueClass,
}: FeedSummaryCardProps) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/40 p-4">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${valueClass}`} />

        <p className="text-sm text-slate-400">
          {label}
        </p>
      </div>

      <p
        className={`mt-2 text-2xl font-bold ${valueClass}`}
      >
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function createSimulatedEvent(
  analysis: UploadResult,
): LiveEvent {
  const timestamp = new Date();
  const randomValue = Math.random();

  const topIp = [...analysis.suspicious_ips].sort(
    (firstIp, secondIp) =>
      secondIp.attempts - firstIp.attempts,
  )[0];

  const primaryDetection =
    analysis.detections[0];

  if (randomValue < 0.25 && topIp) {
    return {
      id: crypto.randomUUID(),
      timestamp,
      title: "Repeated authentication failure",
      description: `${topIp.ip} generated another suspicious authentication event.`,
      severity:
        topIp.attempts >= 10
          ? "High"
          : "Medium",
      source: topIp.ip,
      icon: AlertTriangle,
    };
  }

  if (
    randomValue < 0.5 &&
    primaryDetection
  ) {
    return {
      id: crypto.randomUUID(),
      timestamp,
      title: "Detection rule matched",
      description: `${primaryDetection.type} matched MITRE ATT&CK technique ${primaryDetection.mitre_id}.`,
      severity: primaryDetection.severity,
      icon: ShieldAlert,
    };
  }

  if (randomValue < 0.75) {
    return {
      id: crypto.randomUUID(),
      timestamp,
      title: "Risk model updated",
      description: `Current risk score remains ${analysis.risk_score}/100 with a ${analysis.risk_level.toLowerCase()} classification.`,
      severity:
        analysis.risk_level === "Critical"
          ? "Critical"
          : analysis.risk_level === "High"
            ? "High"
            : analysis.risk_level === "Medium"
              ? "Medium"
              : "Low",
      icon: Activity,
    };
  }

  return {
    id: crypto.randomUUID(),
    timestamp,
    title: "Monitoring heartbeat received",
    description:
      "SentinelAI monitoring services are active and processing security telemetry.",
    severity: "Success",
    icon: CheckCircle2,
  };
}

export default LiveEventFeed;
