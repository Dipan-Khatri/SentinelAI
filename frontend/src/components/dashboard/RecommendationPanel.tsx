import {
  ArrowRight,
  Clock3,
} from "lucide-react";
import { Link } from "react-router-dom";

import type {
  Detection,
  UploadResult,
} from "../../services/api";

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
  analysis: UploadResult;
};

function RecommendationPanel({
  analysis,
}: Props) {
  const primaryDetection =
    analysis.detections[0];

  return (
    <section className="rounded-xl border border-blue-500/30 bg-gradient-to-br from-slate-800 to-blue-950/40 p-6 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-blue-500/15 p-3">
          <Clock3 className="h-7 w-7 text-blue-400" />
        </div>

        <div>
          <h2 className="text-2xl font-bold">
            AI Recommendation
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Recommended analyst action based on
            the latest evidence.
          </p>
        </div>
      </div>

      {primaryDetection ? (
        <>
          <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold">
                Investigate{" "}
                {primaryDetection.type}
              </h3>

              <p className="mt-2 max-w-3xl text-slate-300">
                {
                  primaryDetection.description
                }
              </p>
            </div>

            <span
              className={`rounded-full border px-4 py-2 text-sm font-bold ${
                severityStyles[
                  primaryDetection.severity
                ]
              }`}
            >
              {primaryDetection.severity}
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <RecommendationMetric
              label="Confidence"
              value={`${primaryDetection.confidence}%`}
            />

            <RecommendationMetric
              label="MITRE Technique"
              value={
                primaryDetection.mitre_id
              }
            />

            <RecommendationMetric
              label="Source IP"
              value={
                primaryDetection.source_ip ??
                "Unknown"
              }
              monospace
            />
          </div>

          <div className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-5">
            <p className="font-semibold text-amber-300">
              Recommended First Action
            </p>

            <p className="mt-2 text-sm text-slate-300">
              {primaryDetection
                .recommendations?.[0] ??
                "Review authentication logs, verify user activity, and investigate the originating IP address."}
            </p>
          </div>

          <Link
            to="/investigations"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium transition hover:bg-blue-700"
          >
            Open Investigation
            <ArrowRight className="h-4 w-4" />
          </Link>
        </>
      ) : (
        <div className="mt-6 rounded-lg border border-green-500/30 bg-green-500/10 p-5">
          <p className="font-semibold text-green-300">
            No Immediate Action Required
          </p>

          <p className="mt-2 text-sm text-green-400">
            No high-priority detections were
            found in the latest analysis.
          </p>
        </div>
      )}
    </section>
  );
}

type RecommendationMetricProps = {
  label: string;
  value: string;
  monospace?: boolean;
};

function RecommendationMetric({
  label,
  value,
  monospace = false,
}: RecommendationMetricProps) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-4">
      <p className="text-sm text-slate-400">
        {label}
      </p>

      <p
        className={`mt-2 font-semibold text-white ${
          monospace ? "font-mono" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default RecommendationPanel;0.0
