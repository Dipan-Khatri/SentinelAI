import {
  Activity,
  AlertTriangle,
  Bot,
  Clock3,
  FileSearch,
  ShieldCheck,
} from "lucide-react";

import type { UploadResult } from "../../services/api";

type SecurityActivityTimelineProps = {
  analysis: UploadResult;
};

type TimelineItem = {
  title: string;
  description: string;
  icon: React.ElementType;
  iconClass: string;
  backgroundClass: string;
};

function SecurityActivityTimeline({
  analysis,
}: SecurityActivityTimelineProps) {
  const primaryDetection = analysis.detections[0];

  const timelineItems: TimelineItem[] = [
    {
      title: "Log analysis completed",
      description: `${analysis.entries.toLocaleString()} security events were processed from ${analysis.filename}.`,
      icon: FileSearch,
      iconClass: "text-blue-400",
      backgroundClass: "bg-blue-500/15",
    },
    {
      title: "Authentication activity reviewed",
      description: `${analysis.failed_logins} failed and ${analysis.successful_logins} successful login events were identified.`,
      icon: Activity,
      iconClass: "text-purple-400",
      backgroundClass: "bg-purple-500/15",
    },
    {
      title: "Risk score calculated",
      description: `SentinelAI assigned a ${analysis.risk_level.toLowerCase()} risk rating with a score of ${analysis.risk_score}/100.`,
      icon: AlertTriangle,
      iconClass:
        analysis.risk_level === "Critical"
          ? "text-red-400"
          : analysis.risk_level === "High"
            ? "text-orange-400"
            : analysis.risk_level === "Medium"
              ? "text-amber-400"
              : "text-green-400",
      backgroundClass:
        analysis.risk_level === "Critical"
          ? "bg-red-500/15"
          : analysis.risk_level === "High"
            ? "bg-orange-500/15"
            : analysis.risk_level === "Medium"
              ? "bg-amber-500/15"
              : "bg-green-500/15",
    },
    {
      title: primaryDetection
        ? `${primaryDetection.mitre_id} technique identified`
        : "MITRE ATT&CK review completed",
      description: primaryDetection
        ? `${primaryDetection.type} was detected with ${primaryDetection.confidence}% confidence.`
        : "No MITRE ATT&CK techniques were identified in this analysis.",
      icon: ShieldCheck,
      iconClass: "text-green-400",
      backgroundClass: "bg-green-500/15",
    },
    {
      title: "AI recommendation generated",
      description: primaryDetection
        ? primaryDetection.recommendations?.[0] ??
          "Review the related events and validate the detected security activity."
        : "Continue monitoring and analyze additional logs.",
      icon: Bot,
      iconClass: "text-cyan-400",
      backgroundClass: "bg-cyan-500/15",
    },
  ];

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-lg">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Security Activity Timeline
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Key events generated from the latest SentinelAI analysis.
          </p>
        </div>

        <div className="rounded-lg bg-blue-500/15 p-3">
          <Clock3 className="h-7 w-7 text-blue-400" />
        </div>
      </div>

      <div className="mt-7 space-y-1">
        {timelineItems.map((item, index) => {
          const Icon = item.icon;
          const isLastItem = index === timelineItems.length - 1;

          return (
            <div
              key={`${item.title}-${index}`}
              className="relative flex gap-4"
            >
              {!isLastItem && (
                <div className="absolute left-5 top-11 h-[calc(100%-1rem)] w-px bg-slate-700" />
              )}

              <div
                className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${item.backgroundClass}`}
              >
                <Icon className={`h-5 w-5 ${item.iconClass}`} />
              </div>

              <div className="pb-7">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-semibold text-white">
                    {item.title}
                  </h3>

                  <span className="text-xs text-slate-500">
                    Step {index + 1}
                  </span>
                </div>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default SecurityActivityTimeline;
