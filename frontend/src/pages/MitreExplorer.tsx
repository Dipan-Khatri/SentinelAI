import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Filter,
  Network,
  Search,
  ShieldAlert,
  Target,
  UserRound,
} from "lucide-react";

import type {
  Detection,
  UploadResult,
} from "../services/api";

const ANALYSIS_STORAGE_KEY = "sentinelai_latest_analysis";
const INVESTIGATION_STORAGE_KEY =
  "sentinelai_investigation_state";

type MitreTechniqueInformation = {
  id: string;
  name: string;
  tactic: string;
  description: string;
  defensiveGuidance: string[];
};

type MitreTechniqueGroup = {
  information: MitreTechniqueInformation;
  detections: Detection[];
  sourceIps: string[];
  affectedUsers: string[];
  highestSeverity: Detection["severity"];
  averageConfidence: number;
  totalEvents: number;
};

type SavedInvestigationState = {
  selectedDetectionIndex: number;
  status: string;
  notes: string;
  completedActions: string[];
};

const MITRE_TECHNIQUES: Record<
  string,
  MitreTechniqueInformation
> = {
  T1110: {
    id: "T1110",
    name: "Brute Force",
    tactic: "Credential Access",
    description:
      "Adversaries may use repeated authentication attempts to gain access to accounts when valid credentials are unknown.",
    defensiveGuidance: [
      "Enforce multifactor authentication on exposed accounts.",
      "Use account lockout or authentication rate limiting.",
      "Monitor repeated failures from the same source IP.",
      "Require strong and unique passwords.",
    ],
  },

  "T1110.001": {
    id: "T1110.001",
    name: "Password Guessing",
    tactic: "Credential Access",
    description:
      "Adversaries may attempt to guess passwords for valid or privileged accounts through repeated authentication attempts.",
    defensiveGuidance: [
      "Review accounts targeted by repeated password attempts.",
      "Protect privileged accounts with multifactor authentication.",
      "Restrict remote authentication access where possible.",
      "Alert on repeated failed attempts against administrative users.",
    ],
  },

  "T1110.003": {
    id: "T1110.003",
    name: "Password Spraying",
    tactic: "Credential Access",
    description:
      "Adversaries may use a small number of commonly used passwords against many accounts to avoid account lockout controls.",
    defensiveGuidance: [
      "Detect one source attempting access to multiple accounts.",
      "Use multifactor authentication for all remote access.",
      "Identify accounts using weak or commonly exposed passwords.",
      "Rate-limit authentication attempts by source address.",
    ],
  },

  T1078: {
    id: "T1078",
    name: "Valid Accounts",
    tactic: "Defense Evasion, Persistence, Privilege Escalation",
    description:
      "Adversaries may obtain and abuse valid account credentials to access systems, maintain persistence, or avoid detection.",
    defensiveGuidance: [
      "Investigate successful authentication after repeated failures.",
      "Reset credentials when account compromise is suspected.",
      "Review activity performed during the successful session.",
      "Disable inactive and unnecessary accounts.",
    ],
  },
};

const severityStyles: Record<Detection["severity"], string> = {
  Critical:
    "border-red-500/40 bg-red-500/15 text-red-300",
  High:
    "border-orange-500/40 bg-orange-500/15 text-orange-300",
  Medium:
    "border-amber-500/40 bg-amber-500/15 text-amber-300",
  Low:
    "border-blue-500/40 bg-blue-500/15 text-blue-300",
};

const severityOrder: Record<Detection["severity"], number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

function MitreExplorer() {
  const [analysis, setAnalysis] =
    useState<UploadResult | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] =
    useState<"All" | Detection["severity"]>("All");

  const [selectedTechniqueId, setSelectedTechniqueId] =
    useState<string | null>(null);

  useEffect(() => {
    const savedAnalysis = localStorage.getItem(
      ANALYSIS_STORAGE_KEY,
    );

    if (!savedAnalysis) {
      return;
    }

    try {
      const parsedAnalysis = JSON.parse(
        savedAnalysis,
      ) as UploadResult;

      setAnalysis(parsedAnalysis);

      const firstTechniqueId =
        parsedAnalysis.detections[0]?.mitre_id;

      if (firstTechniqueId) {
        setSelectedTechniqueId(firstTechniqueId);
      }
    } catch {
      localStorage.removeItem(ANALYSIS_STORAGE_KEY);
    }
  }, []);

  const techniqueGroups = useMemo(() => {
    if (!analysis) {
      return [];
    }

    const detectionsByTechnique = new Map<
      string,
      Detection[]
    >();

    analysis.detections.forEach((detection) => {
      const existingDetections =
        detectionsByTechnique.get(detection.mitre_id) ?? [];

      existingDetections.push(detection);

      detectionsByTechnique.set(
        detection.mitre_id,
        existingDetections,
      );
    });

    const groups: MitreTechniqueGroup[] = [];

    detectionsByTechnique.forEach(
      (detections, techniqueId) => {
        const knownInformation =
          MITRE_TECHNIQUES[techniqueId];

        const information: MitreTechniqueInformation =
          knownInformation ?? {
            id: techniqueId,
            name: "Mapped Security Technique",
            tactic: "Unknown Tactic",
            description:
              "This technique was mapped by SentinelAI, but additional MITRE ATT&CK information has not yet been added to the local technique catalog.",
            defensiveGuidance: [
              "Review the detection evidence.",
              "Validate the associated source IP and accounts.",
              "Document the analyst findings.",
            ],
          };

        const sourceIps = Array.from(
          new Set(
            detections
              .map((detection) => detection.source_ip)
              .filter(
                (sourceIp): sourceIp is string =>
                  sourceIp !== null,
              ),
          ),
        );

        const affectedUsers = Array.from(
          new Set(
            detections.flatMap(
              (detection) =>
                detection.affected_users,
            ),
          ),
        );

        const highestSeverity = detections.reduce(
          (currentHighest, detection) => {
            return severityOrder[detection.severity] >
              severityOrder[currentHighest]
              ? detection.severity
              : currentHighest;
          },
          detections[0].severity,
        );

      const averageConfidence = Math.round(
  detections.reduce(
    (total, detection) =>
      total + (detection.confidence ?? 0),
    0,
  ) / detections.length,
);

        const totalEvents = detections.reduce(
          (total, detection) =>
            total + detection.event_count,
          0,
        );

        groups.push({
          information,
          detections,
          sourceIps,
          affectedUsers,
          highestSeverity,
          averageConfidence,
          totalEvents,
        });
      },
    );

    return groups.sort(
      (firstGroup, secondGroup) =>
        severityOrder[secondGroup.highestSeverity] -
        severityOrder[firstGroup.highestSeverity],
    );
  }, [analysis]);

  const filteredTechniqueGroups = useMemo(() => {
    const normalizedSearch = searchQuery
      .trim()
      .toLowerCase();

    return techniqueGroups.filter((group) => {
      const matchesSeverity =
        severityFilter === "All" ||
        group.highestSeverity === severityFilter;

      const matchesSearch =
        normalizedSearch === "" ||
        group.information.id
          .toLowerCase()
          .includes(normalizedSearch) ||
        group.information.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        group.information.tactic
          .toLowerCase()
          .includes(normalizedSearch) ||
        group.detections.some((detection) =>
          detection.type
            .toLowerCase()
            .includes(normalizedSearch),
        ) ||
        group.sourceIps.some((sourceIp) =>
          sourceIp.includes(normalizedSearch),
        ) ||
        group.affectedUsers.some((user) =>
          user.toLowerCase().includes(normalizedSearch),
        );

      return matchesSeverity && matchesSearch;
    });
  }, [
    searchQuery,
    severityFilter,
    techniqueGroups,
  ]);

  const selectedTechnique = useMemo(() => {
    if (filteredTechniqueGroups.length === 0) {
      return null;
    }

    return (
      filteredTechniqueGroups.find(
        (group) =>
          group.information.id === selectedTechniqueId,
      ) ?? filteredTechniqueGroups[0]
    );
  }, [
    filteredTechniqueGroups,
    selectedTechniqueId,
  ]);

  function startTechniqueInvestigation(
    technique: MitreTechniqueGroup,
  ) {
    if (!analysis) {
      return;
    }

    const selectedDetection =
      technique.detections[0];

    const detectionIndex =
      analysis.detections.findIndex(
        (detection) =>
          detection === selectedDetection,
      );

    const investigationState: SavedInvestigationState = {
      selectedDetectionIndex:
        detectionIndex >= 0 ? detectionIndex : 0,
      status: "Open",
      notes: "",
      completedActions: [],
    };

    localStorage.setItem(
      INVESTIGATION_STORAGE_KEY,
      JSON.stringify(investigationState),
    );
  }

  if (!analysis) {
    return <EmptyMitreExplorer />;
  }

  if (analysis.detections.length === 0) {
    return <NoMappedTechniques />;
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <header>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-500/15 p-3">
              <Target className="h-8 w-8 text-blue-400" />
            </div>

            <div>
              <h1 className="text-4xl font-bold">
                MITRE ATT&CK Explorer
              </h1>

              <p className="mt-2 text-slate-400">
                Explore techniques mapped from the latest
                SentinelAI log analysis.
              </p>
            </div>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              label="Techniques"
              value={techniqueGroups.length}
              valueClass="text-blue-400"
            />

            <SummaryCard
              label="Mapped Detections"
              value={analysis.detections.length}
              valueClass="text-red-400"
            />

            <SummaryCard
              label="Suspicious IPs"
              value={analysis.suspicious_ips.length}
              valueClass="text-orange-400"
            />

            <SummaryCard
              label="Affected Accounts"
              value={
                new Set(
                  analysis.detections.flatMap(
                    (detection) =>
                      detection.affected_users,
                  ),
                ).size
              }
              valueClass="text-purple-400"
            />
          </div>
        </header>

        <section className="mt-8 rounded-xl border border-slate-700 bg-slate-800 p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
            <label className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

              <input
                type="text"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
                placeholder="Search technique, tactic, source IP, account, or detection..."
                className="w-full rounded-lg border border-slate-600 bg-slate-950 py-3 pl-12 pr-4 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
              />
            </label>

            <label className="relative">
              <Filter className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

              <select
                value={severityFilter}
                onChange={(event) =>
                  setSeverityFilter(
                    event.target.value as
                      | "All"
                      | Detection["severity"],
                  )
                }
                className="w-full appearance-none rounded-lg border border-slate-600 bg-slate-950 py-3 pl-12 pr-4 text-white outline-none transition focus:border-blue-500"
              >
                <option value="All">
                  All severities
                </option>
                <option value="Critical">
                  Critical
                </option>
                <option value="High">High</option>
                <option value="Medium">
                  Medium
                </option>
                <option value="Low">Low</option>
              </select>
            </label>
          </div>
        </section>

        {filteredTechniqueGroups.length > 0 &&
        selectedTechnique ? (
          <section className="mt-8 grid gap-6 xl:grid-cols-[360px_1fr]">
            <aside className="rounded-xl border border-slate-700 bg-slate-800 p-5">
              <div>
                <h2 className="text-xl font-bold">
                  Detected Techniques
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  {filteredTechniqueGroups.length} technique(s)
                  match the current filters.
                </p>
              </div>

              <div className="mt-5 space-y-3">
                {filteredTechniqueGroups.map(
                  (group) => {
                    const isSelected =
                      selectedTechnique.information.id ===
                      group.information.id;

                    return (
                      <button
                        key={group.information.id}
                        type="button"
                        onClick={() =>
                          setSelectedTechniqueId(
                            group.information.id,
                          )
                        }
                        className={`w-full rounded-lg border p-4 text-left transition ${
                          isSelected
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-slate-700 bg-slate-950/50 hover:border-slate-500"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-mono text-sm font-semibold text-blue-400">
                              {group.information.id}
                            </p>

                            <h3 className="mt-1 font-semibold">
                              {group.information.name}
                            </h3>
                          </div>

                          <span
                            className={`rounded-full border px-2 py-1 text-xs font-semibold ${
                              severityStyles[
                                group.highestSeverity
                              ]
                            }`}
                          >
                            {group.highestSeverity}
                          </span>
                        </div>

                        <p className="mt-3 text-sm text-slate-400">
                          {group.information.tactic}
                        </p>

                        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                          <span>
                            {group.detections.length} detection(s)
                          </span>

                          <span>
                            {group.averageConfidence}% confidence
                          </span>
                        </div>
                      </button>
                    );
                  },
                )}
              </div>
            </aside>

            <main className="space-y-6">
              <section className="rounded-xl border border-slate-700 bg-slate-800 p-6">
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div>
                    <p className="font-mono font-semibold text-blue-400">
                      {selectedTechnique.information.id}
                    </p>

                    <h2 className="mt-1 text-3xl font-bold">
                      {selectedTechnique.information.name}
                    </h2>

                    <p className="mt-2 text-sm font-medium text-purple-300">
                      Tactic:{" "}
                      {selectedTechnique.information.tactic}
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-4 py-2 text-sm font-bold ${
                      severityStyles[
                        selectedTechnique.highestSeverity
                      ]
                    }`}
                  >
                    {selectedTechnique.highestSeverity}
                  </span>
                </div>

                <p className="mt-6 max-w-4xl leading-7 text-slate-300">
                  {
                    selectedTechnique.information
                      .description
                  }
                </p>

                <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <TechniqueMetric
                    label="Detections"
                    value={String(
                      selectedTechnique.detections.length,
                    )}
                    valueClass="text-red-300"
                  />

                  <TechniqueMetric
                    label="Average Confidence"
                    value={`${selectedTechnique.averageConfidence}%`}
                    valueClass="text-green-400"
                  />

                  <TechniqueMetric
                    label="Related Events"
                    value={String(
                      selectedTechnique.totalEvents,
                    )}
                  />

                  <TechniqueMetric
                    label="Source IPs"
                    value={String(
                      selectedTechnique.sourceIps.length,
                    )}
                    valueClass="text-orange-300"
                  />
                </div>
              </section>

              <section className="grid gap-6 lg:grid-cols-2">
                <InformationPanel
                  icon={Network}
                  title="Source IP Addresses"
                  description="Sources associated with this technique."
                >
                  {selectedTechnique.sourceIps.length >
                  0 ? (
                    <div className="space-y-3">
                      {selectedTechnique.sourceIps.map(
                        (sourceIp) => (
                          <div
                            key={sourceIp}
                            className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 font-mono text-red-300"
                          >
                            {sourceIp}
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <EmptyInformationText>
                      No source IP was identified.
                    </EmptyInformationText>
                  )}
                </InformationPanel>

                <InformationPanel
                  icon={UserRound}
                  title="Affected Accounts"
                  description="Accounts associated with this technique."
                >
                  {selectedTechnique.affectedUsers.length >
                  0 ? (
                    <div className="flex flex-wrap gap-3">
                      {selectedTechnique.affectedUsers.map(
                        (user) => (
                          <span
                            key={user}
                            className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-purple-300"
                          >
                            {user}
                          </span>
                        ),
                      )}
                    </div>
                  ) : (
                    <EmptyInformationText>
                      No affected account was identified.
                    </EmptyInformationText>
                  )}
                </InformationPanel>
              </section>

              <section className="rounded-xl border border-slate-700 bg-slate-800 p-6">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="h-7 w-7 text-red-400" />

                  <div>
                    <h2 className="text-xl font-bold">
                      Related SentinelAI Detections
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                      Detection rules mapped to this MITRE
                      ATT&CK technique.
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {selectedTechnique.detections.map(
                    (detection, index) => (
                      <article
                        key={`${detection.type}-${detection.source_ip}-${index}`}
                        className="rounded-xl border border-slate-700 bg-slate-950/50 p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">
                              Detection #{index + 1}
                            </p>

                            <h3 className="mt-1 text-lg font-semibold">
                              {detection.type}
                            </h3>
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

                        <p className="mt-4 text-slate-300">
                          {detection.description}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                          <span>
                            <span className="text-slate-500">
                              Confidence:{" "}
                            </span>

                            <span className="text-green-400">
                              {detection.confidence}%
                            </span>
                          </span>

                          <span>
                            <span className="text-slate-500">
                              Events:{" "}
                            </span>

                            <span>
                              {detection.event_count}
                            </span>
                          </span>

                          {detection.source_ip && (
                            <span>
                              <span className="text-slate-500">
                                Source:{" "}
                              </span>

                              <span className="font-mono text-red-300">
                                {detection.source_ip}
                              </span>
                            </span>
                          )}
                        </div>
                      </article>
                    ),
                  )}
                </div>
              </section>

              <section className="rounded-xl border border-green-500/30 bg-green-500/10 p-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-7 w-7 text-green-400" />

                  <div>
                    <h2 className="text-xl font-bold text-green-300">
                      Defensive Guidance
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                      Recommended controls for reducing exposure
                      to this technique.
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {selectedTechnique.information.defensiveGuidance.map(
                    (guidance, index) => (
                      <div
                        key={guidance}
                        className="flex items-start gap-3 rounded-lg border border-green-500/20 bg-slate-950/30 p-4"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-500/20 text-xs font-bold text-green-300">
                          {index + 1}
                        </div>

                        <p className="text-slate-200">
                          {guidance}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </section>

              <section className="flex flex-wrap items-center justify-between gap-5 rounded-xl border border-blue-500/30 bg-blue-500/10 p-6">
                <div>
                  <h2 className="text-xl font-bold">
                    Investigate This Technique
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Open the highest-priority related detection
                    in the investigation workspace.
                  </p>
                </div>

                <Link
                  to="/investigations"
                  onClick={() =>
                    startTechniqueInvestigation(
                      selectedTechnique,
                    )
                  }
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium transition hover:bg-blue-700"
                >
                  Start Investigation
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </section>
            </main>
          </section>
        ) : (
          <section className="mt-8 rounded-xl border border-dashed border-slate-600 bg-slate-800 p-12 text-center">
            <Search className="mx-auto h-12 w-12 text-slate-500" />

            <h2 className="mt-5 text-2xl font-bold">
              No matching techniques
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-slate-400">
              Try changing the search text or severity
              filter.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSeverityFilter("All");
              }}
              className="mt-6 rounded-lg bg-blue-600 px-5 py-3 font-medium transition hover:bg-blue-700"
            >
              Clear Filters
            </button>
          </section>
        )}
      </div>
    </div>
  );
}

type SummaryCardProps = {
  label: string;
  value: number;
  valueClass: string;
};

function SummaryCard({
  label,
  value,
  valueClass,
}: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
      <p className="text-sm text-slate-400">
        {label}
      </p>

      <p
        className={`mt-2 text-3xl font-bold ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}

type TechniqueMetricProps = {
  label: string;
  value: string;
  valueClass?: string;
};

function TechniqueMetric({
  label,
  value,
  valueClass = "text-white",
}: TechniqueMetricProps) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-4">
      <p className="text-sm text-slate-400">
        {label}
      </p>

      <p
        className={`mt-2 text-xl font-bold ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}

type InformationPanelProps = {
  icon: typeof Network;
  title: string;
  description: string;
  children: React.ReactNode;
};

function InformationPanel({
  icon: Icon,
  title,
  description,
  children,
}: InformationPanelProps) {
  return (
    <section className="rounded-xl border border-slate-700 bg-slate-800 p-6">
      <div className="flex items-center gap-3">
        <Icon className="h-6 w-6 text-blue-400" />

        <div>
          <h2 className="text-xl font-bold">
            {title}
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-5">
        {children}
      </div>
    </section>
  );
}

type EmptyInformationTextProps = {
  children: React.ReactNode;
};

function EmptyInformationText({
  children,
}: EmptyInformationTextProps) {
  return (
    <p className="rounded-lg border border-slate-700 bg-slate-950/50 p-4 text-sm text-slate-400">
      {children}
    </p>
  );
}

function EmptyMitreExplorer() {
  return (
    <div className="min-h-screen bg-slate-900 p-8 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold">
          MITRE ATT&CK Explorer
        </h1>

        <section className="mt-10 rounded-xl border border-dashed border-slate-600 bg-slate-800 p-12 text-center">
          <Target className="mx-auto h-14 w-14 text-blue-400" />

          <h2 className="mt-5 text-2xl font-bold">
            No analysis data available
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-slate-400">
            Analyze a security log before exploring mapped
            MITRE ATT&CK techniques.
          </p>

          <Link
            to="/upload"
            className="mt-7 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium transition hover:bg-blue-700"
          >
            Upload Security Logs
            <ArrowRight className="h-5 w-5" />
          </Link>
        </section>
      </div>
    </div>
  );
}

function NoMappedTechniques() {
  return (
    <div className="min-h-screen bg-slate-900 p-8 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold">
          MITRE ATT&CK Explorer
        </h1>

        <section className="mt-10 rounded-xl border border-green-500/30 bg-green-500/10 p-12 text-center">
          <BookOpen className="mx-auto h-14 w-14 text-green-400" />

          <h2 className="mt-5 text-2xl font-bold">
            No techniques detected
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-green-300">
            The latest analysis did not generate any MITRE
            ATT&CK mappings.
          </p>

          <Link
            to="/"
            className="mt-7 inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-3 font-medium transition hover:bg-green-700"
          >
            Return to Dashboard
            <ArrowRight className="h-5 w-5" />
          </Link>
        </section>
      </div>
    </div>
  );
}

export default MitreExplorer;
