import {
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { Link } from "react-router-dom";

import type { Detection } from "../../services/api";

const severityStyles: Record<
  Detection["severity"],
  string
> = {
  Critical:
    "border-red-500/40 bg-red-500/15 text-red-300",
  High:
    "border-orange-500/40 bg-orange-500/15 text-orange-300",
  Medium:
    "border-amber-500/40 bg-amber-500/15 text-amber-300",
  Low:
    "border-blue-500/40 bg-blue-500/15 text-blue-300",
};

type Props = {
  detections: Detection[];
};

function RecentAlerts({
  detections,
}: Props) {
  return (
    <section className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-lg">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">
            Recent Security Alerts
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Highest priority detections from the latest analysis.
          </p>
        </div>

        <ShieldAlert className="h-7 w-7 text-red-400" />
      </div>

      <div className="mt-6 space-y-4">
        {detections.length > 0 ? (
          detections.map(
            (detection, index) => (
              <article
                key={`${detection.type}-${detection.source_ip}-${index}`}
                className="rounded-lg border border-slate-700 bg-slate-950/60 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">
                      {detection.type}
                    </h3>

                    <p className="mt-1 text-sm text-slate-400">
                      {detection.source_ip
                        ? `Source: ${detection.source_ip}`
                        : "No source IP identified"}
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      severityStyles[
                        detection.severity
                      ]
                    }`}
                  >
                    {detection.severity}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                  <span className="text-blue-400">
                    {detection.mitre_id}
                  </span>

                  <span className="text-green-400">
                    {detection.confidence}% confidence
                  </span>

                  <span className="text-slate-400">
                    {detection.event_count} event(s)
                  </span>
                </div>
              </article>
            ),
          )

                ) : (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-5">
            <p className="font-semibold text-green-300">
              No security alerts detected
            </p>

            <p className="mt-1 text-sm text-green-400">
              The latest log did not match any active detection rules.
            </p>
          </div>
        )}
      </div>

      <Link
        to="/upload"
        className="mt-6 flex items-center justify-center gap-2 rounded-lg border border-slate-600 px-4 py-3 font-medium text-slate-200 transition hover:border-blue-500 hover:text-blue-400"
      >
        View Full Analysis
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}

export default RecentAlerts;
  