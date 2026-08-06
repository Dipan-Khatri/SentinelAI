import {
  Activity,
  Crosshair,
  ShieldAlert,
  Target,
} from "lucide-react";

import type {
  Detection,
  UploadResult,
} from "../../services/api";

type MitreAttackHeatmapProps = {
  analysis: UploadResult;
};

type TechniqueSummary = {
  mitreId: string;
  title: string;
  count: number;
  highestSeverity: Detection["severity"];
  averageConfidence: number;
  intensity: number;
};

const severityWeight: Record<
  Detection["severity"],
  number
> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

function MitreAttackHeatmap({
  analysis,
}: MitreAttackHeatmapProps) {
  const techniques =
    buildTechniqueSummaries(
      analysis.detections,
    );

  const totalMappings =
    techniques.reduce(
      (total, technique) =>
        total + technique.count,
      0,
    );

  const averageConfidence =
    analysis.detections.length > 0
      ? Math.round(
          analysis.detections.reduce(
            (total, detection) =>
              total +
              detection.confidence,
            0,
          ) /
            analysis.detections.length,
        )
      : 0;

  const highestTechnique =
    techniques[0] ?? null;

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-800 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-400">
            MITRE ATT&CK Intelligence
          </p>

          <h2 className="mt-2 text-2xl font-bold text-white">
            MITRE ATT&CK Heatmap
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Detection frequency, severity, and confidence
            combined into a visual ATT&CK technique
            intensity score.
          </p>
        </div>

        <div className="rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-300">
          {techniques.length} technique
          {techniques.length === 1
            ? ""
            : "s"}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <HeatmapMetric
          icon={Target}
          label="Unique Techniques"
          value={techniques.length}
          valueClass="text-purple-300"
        />

        <HeatmapMetric
          icon={Crosshair}
          label="Total Mappings"
          value={totalMappings}
          valueClass="text-blue-300"
        />

        <HeatmapMetric
          icon={Activity}
          label="Average Confidence"
          value={`${averageConfidence}%`}
          valueClass="text-green-300"
        />

        <HeatmapMetric
          icon={ShieldAlert}
          label="Highest Priority"
          value={
            highestTechnique
              ? highestTechnique.mitreId
              : "None"
          }
          valueClass={
            highestTechnique
              ? getSeverityTextClass(
                  highestTechnique.highestSeverity,
                )
              : "text-slate-300"
          }
        />
      </div>

      {techniques.length > 0 ? (
        <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {techniques.map(
            (technique) => (
              <article
                key={technique.mitreId}
                className={`relative overflow-hidden rounded-xl border p-5 ${getHeatmapCardClass(
                  technique.intensity,
                )}`}
              >
                <div
                  className={`absolute inset-y-0 left-0 w-1.5 ${getHeatmapAccentClass(
                    technique.intensity,
                  )}`}
                />

                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-bold text-blue-300">
                      {technique.mitreId}
                    </p>

                    <h3 className="mt-2 break-words text-lg font-semibold text-white">
                      {technique.title}
                    </h3>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${getSeverityBadgeClass(
                      technique.highestSeverity,
                    )}`}
                  >
                    {technique.highestSeverity}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <TechniqueMetric
                    label="Detections"
                    value={technique.count}
                  />

                  <TechniqueMetric
                    label="Confidence"
                    value={`${technique.averageConfidence}%`}
                  />

                  <TechniqueMetric
                    label="Intensity"
                    value={`${technique.intensity}%`}
                  />
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      Relative ATT&CK activity
                    </span>

                    <span>
                      {technique.intensity}%
                    </span>
                  </div>

                  <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-950">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${getHeatmapAccentClass(
                        technique.intensity,
                      )}`}
                      style={{
                        width: `${technique.intensity}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-10 gap-1">
                  {Array.from({
                    length: 10,
                  }).map((_, index) => {
                    const active =
                      index <
                      Math.ceil(
                        technique.intensity /
                          10,
                      );

                    return (
                      <div
                        key={index}
                        className={`h-3 rounded-sm ${
                          active
                            ? getHeatmapCellClass(
                                technique.intensity,
                              )
                            : "bg-slate-900"
                        }`}
                      />
                    );
                  })}
                </div>
              </article>
            ),
          )}
        </div>
      ) : (
        <div className="mt-7 rounded-xl border border-dashed border-slate-600 bg-slate-950/40 p-10 text-center">
          <Target className="mx-auto h-12 w-12 text-slate-600" />

          <h3 className="mt-4 text-lg font-semibold text-slate-300">
            No MITRE mappings available
          </h3>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Analyze a security log containing mapped
            detections to populate the ATT&CK heatmap.
          </p>
        </div>
      )}
    </section>
  );
}

type HeatmapMetricProps = {
  icon: React.ComponentType<{
    className?: string;
  }>;
  label: string;
  value: string | number;
  valueClass: string;
};

function HeatmapMetric({
  icon: Icon,
  label,
  value,
  valueClass,
}: HeatmapMetricProps) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-4">
      <div className="flex items-center gap-2 text-slate-400">
        <Icon className="h-4 w-4" />

        <span className="text-sm">
          {label}
        </span>
      </div>

      <p
        className={`mt-3 text-2xl font-bold ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}

function TechniqueMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-3 text-center">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-white">
        {value}
      </p>
    </div>
  );
}

function buildTechniqueSummaries(
  detections: Detection[],
): TechniqueSummary[] {
  const techniqueMap = new Map<
    string,
    {
      mitreId: string;
      title: string;
      count: number;
      highestSeverity: Detection["severity"];
      confidenceTotal: number;
    }
  >();

  detections.forEach(
    (detection) => {
      const existing =
        techniqueMap.get(
          detection.mitre_id,
        );

      if (!existing) {
        techniqueMap.set(
          detection.mitre_id,
          {
            mitreId:
              detection.mitre_id,
            title:
              detection.type,
            count: 1,
            highestSeverity:
              detection.severity,
            confidenceTotal:
              detection.confidence,
          },
        );

        return;
      }

      existing.count += 1;

      existing.confidenceTotal +=
        detection.confidence;

      if (
        severityWeight[
          detection.severity
        ] >
        severityWeight[
          existing.highestSeverity
        ]
      ) {
        existing.highestSeverity =
          detection.severity;
      }
    },
  );

  const maximumCount = Math.max(
    ...Array.from(
      techniqueMap.values(),
    ).map(
      (technique) =>
        technique.count,
    ),
    1,
  );

  return Array.from(
    techniqueMap.values(),
  )
    .map(
      (technique) => {
        const averageConfidence =
          Math.round(
            technique.confidenceTotal /
              technique.count,
          );

        const countScore =
          (technique.count /
            maximumCount) *
          45;

        const severityScore =
          (severityWeight[
            technique.highestSeverity
          ] /
            4) *
          35;

        const confidenceScore =
          (averageConfidence /
            100) *
          20;

        const intensity =
          Math.min(
            100,
            Math.max(
              10,
              Math.round(
                countScore +
                  severityScore +
                  confidenceScore,
              ),
            ),
          );

        return {
          mitreId:
            technique.mitreId,
          title:
            technique.title,
          count:
            technique.count,
          highestSeverity:
            technique.highestSeverity,
          averageConfidence,
          intensity,
        };
      },
    )
    .sort(
      (
        firstTechnique,
        secondTechnique,
      ) =>
        secondTechnique.intensity -
        firstTechnique.intensity,
    );
}

function getSeverityBadgeClass(
  severity: Detection["severity"],
) {
  switch (severity) {
    case "Critical":
      return "border-red-500/40 bg-red-500/15 text-red-300";

    case "High":
      return "border-orange-500/40 bg-orange-500/15 text-orange-300";

    case "Medium":
      return "border-amber-500/40 bg-amber-500/15 text-amber-300";

    case "Low":
    default:
      return "border-blue-500/40 bg-blue-500/15 text-blue-300";
  }
}

function getSeverityTextClass(
  severity: Detection["severity"],
) {
  switch (severity) {
    case "Critical":
      return "text-red-300";

    case "High":
      return "text-orange-300";

    case "Medium":
      return "text-amber-300";

    case "Low":
    default:
      return "text-blue-300";
  }
}

function getHeatmapCardClass(
  intensity: number,
) {
  if (intensity >= 80) {
    return "border-red-500/40 bg-red-500/10";
  }

  if (intensity >= 60) {
    return "border-orange-500/40 bg-orange-500/10";
  }

  if (intensity >= 40) {
    return "border-amber-500/40 bg-amber-500/10";
  }

  return "border-blue-500/40 bg-blue-500/10";
}

function getHeatmapAccentClass(
  intensity: number,
) {
  if (intensity >= 80) {
    return "bg-red-500";
  }

  if (intensity >= 60) {
    return "bg-orange-500";
  }

  if (intensity >= 40) {
    return "bg-amber-500";
  }

  return "bg-blue-500";
}

function getHeatmapCellClass(
  intensity: number,
) {
  if (intensity >= 80) {
    return "bg-red-400";
  }

  if (intensity >= 60) {
    return "bg-orange-400";
  }

  if (intensity >= 40) {
    return "bg-amber-400";
  }

  return "bg-blue-400";
}

export default MitreAttackHeatmap;
