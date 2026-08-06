import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileSearch,
  Filter,
  FolderOpen,
  Loader2,
  RefreshCcw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  UserRound,
  XCircle,
} from "lucide-react";

import { useToast } from "../context/ToastContext";

import {
  getAnalysisById,
  getInvestigations,
  historicalAnalysisToUploadResult,
} from "../services/api";

import type {
  HistoricalAnalysisDetail,
  Investigation,
  InvestigationStatus,
  RiskLevel,
} from "../services/api";

const LATEST_ANALYSIS_STORAGE_KEY =
  "sentinelai_latest_analysis";

const SELECTED_DETECTION_STORAGE_KEY =
  "sentinelai_selected_detection_id";

type InvestigationCase =
  Investigation & {
    analysis:
      | HistoricalAnalysisDetail
      | null;
    detectionType: string;
    detectionSeverity:
      | RiskLevel
      | null;
    sourceIp: string | null;
    mitreId: string | null;
    filename: string;
  };

type StatusFilter =
  | "All"
  | InvestigationStatus;

type SeverityFilter =
  | "All"
  | RiskLevel;

type SortOption =
  | "Recently Updated"
  | "Oldest Updated"
  | "Highest Severity"
  | "Case ID";

const statusStyles: Record<
  InvestigationStatus,
  string
> = {
  Open:
    "border-red-500/40 bg-red-500/15 text-red-300",

  "In Progress":
    "border-amber-500/40 bg-amber-500/15 text-amber-300",

  Resolved:
    "border-green-500/40 bg-green-500/15 text-green-300",

  "False Positive":
    "border-slate-500/40 bg-slate-500/15 text-slate-300",
};

const severityStyles: Record<
  RiskLevel,
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

const severityPriority: Record<
  RiskLevel,
  number
> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

function CaseQueue() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [cases, setCases] = useState<
    InvestigationCase[]
  >([]);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("All");

  const [
    severityFilter,
    setSeverityFilter,
  ] = useState<SeverityFilter>("All");

  const [sortOption, setSortOption] =
    useState<SortOption>(
      "Recently Updated",
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [
    openingCaseId,
    setOpeningCaseId,
  ] = useState<number | null>(null);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const loadCases = useCallback(
    async (
      showSuccessToast = false,
    ) => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const investigations =
          await getInvestigations();

        const uniqueAnalysisIds =
          Array.from(
            new Set(
              investigations.map(
                (investigation) =>
                  investigation.analysis_id,
              ),
            ),
          );

        const analysisResults =
          await Promise.allSettled(
            uniqueAnalysisIds.map(
              (analysisId) =>
                getAnalysisById(
                  analysisId,
                ),
            ),
          );

        const analysisMap =
          new Map<
            number,
            HistoricalAnalysisDetail
          >();

        analysisResults.forEach(
          (result, index) => {
            if (
              result.status ===
              "fulfilled"
            ) {
              analysisMap.set(
                uniqueAnalysisIds[index],
                result.value,
              );
            }
          },
        );

        const enrichedCases =
          investigations.map(
            (
              investigation,
            ): InvestigationCase => {
              const analysis =
                analysisMap.get(
                  investigation.analysis_id,
                ) ?? null;

              const detection =
                analysis?.detections.find(
                  (
                    currentDetection,
                  ) =>
                    currentDetection.id ===
                    investigation.detection_id,
                );

              return {
                ...investigation,
                analysis,

                detectionType:
                  detection?.type ??
                  "Unknown Detection",

                detectionSeverity:
                  detection?.severity ??
                  null,

                sourceIp:
                  detection?.source_ip ??
                  null,

                mitreId:
                  detection?.mitre_id ??
                  null,

                filename:
                  analysis?.filename ??
                  "Analysis unavailable",
              };
            },
          );

        setCases(enrichedCases);

        if (showSuccessToast) {
          showToast({
            title:
              "Case queue refreshed",
            message: `${enrichedCases.length.toLocaleString()} investigation case${
              enrichedCases.length === 1
                ? ""
                : "s"
            } loaded from SQLite.`,
            type: "success",
            duration: 3000,
          });
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "SentinelAI could not load the investigation queue.";

        setErrorMessage(message);

        showToast({
          title:
            "Case queue unavailable",
          message,
          type: "error",
          duration: 6000,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [showToast],
  );

  useEffect(() => {
    void loadCases();
  }, [loadCases]);

  const filteredCases =
    useMemo(() => {
      const normalizedSearch =
        searchQuery
          .trim()
          .toLowerCase();

      const matchingCases =
        cases.filter(
          (investigationCase) => {
            const matchesStatus =
              statusFilter === "All" ||
              investigationCase.status ===
                statusFilter;

            const matchesSeverity =
              severityFilter ===
                "All" ||
              investigationCase
                .detectionSeverity ===
                severityFilter;

            const searchableValues = [
              String(
                investigationCase.id,
              ),
              String(
                investigationCase.analysis_id,
              ),
              investigationCase
                .detectionType,
              investigationCase
                .sourceIp ?? "",
              investigationCase
                .mitreId ?? "",
              investigationCase.analyst,
              investigationCase.notes,
              investigationCase.filename,
              investigationCase.status,
              investigationCase
                .detectionSeverity ?? "",
            ];

            const matchesSearch =
              normalizedSearch === "" ||
              searchableValues.some(
                (value) =>
                  value
                    .toLowerCase()
                    .includes(
                      normalizedSearch,
                    ),
              );

            return (
              matchesStatus &&
              matchesSeverity &&
              matchesSearch
            );
          },
        );

      return [...matchingCases].sort(
        (firstCase, secondCase) => {
          if (
            sortOption ===
            "Oldest Updated"
          ) {
            return (
              getTimestamp(
                firstCase.updated_at,
              ) -
              getTimestamp(
                secondCase.updated_at,
              )
            );
          }

          if (
            sortOption ===
            "Highest Severity"
          ) {
            const firstPriority =
              firstCase
                .detectionSeverity
                ? severityPriority[
                    firstCase
                      .detectionSeverity
                  ]
                : 0;

            const secondPriority =
              secondCase
                .detectionSeverity
                ? severityPriority[
                    secondCase
                      .detectionSeverity
                  ]
                : 0;

            return (
              secondPriority -
              firstPriority
            );
          }

          if (
            sortOption ===
            "Case ID"
          ) {
            return (
              secondCase.id -
              firstCase.id
            );
          }

          return (
            getTimestamp(
              secondCase.updated_at,
            ) -
            getTimestamp(
              firstCase.updated_at,
            )
          );
        },
      );
    }, [
      cases,
      searchQuery,
      severityFilter,
      sortOption,
      statusFilter,
    ]);

  const statistics = useMemo(
    () => ({
      total: cases.length,

      open: cases.filter(
        (investigationCase) =>
          investigationCase.status ===
          "Open",
      ).length,

      inProgress: cases.filter(
        (investigationCase) =>
          investigationCase.status ===
          "In Progress",
      ).length,

      resolved: cases.filter(
        (investigationCase) =>
          investigationCase.status ===
          "Resolved",
      ).length,

      falsePositive: cases.filter(
        (investigationCase) =>
          investigationCase.status ===
          "False Positive",
      ).length,
    }),
    [cases],
  );

  async function openCase(
    investigationCase:
      InvestigationCase,
  ) {
    setOpeningCaseId(
      investigationCase.id,
    );

    setErrorMessage("");

    try {
      const analysis =
        investigationCase.analysis ??
        (await getAnalysisById(
          investigationCase.analysis_id,
        ));

      const activeAnalysis =
        historicalAnalysisToUploadResult(
          analysis,
        );

      localStorage.setItem(
        LATEST_ANALYSIS_STORAGE_KEY,
        JSON.stringify(
          activeAnalysis,
        ),
      );

      localStorage.setItem(
        SELECTED_DETECTION_STORAGE_KEY,
        String(
          investigationCase.detection_id,
        ),
      );

      showToast({
        title: `Opening Case #${investigationCase.id}`,
        message:
          investigationCase.detectionType,
        type: "info",
        duration: 1800,
      });

      navigate("/investigations");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "SentinelAI could not open this case.";

      setErrorMessage(message);

      showToast({
        title: "Case could not open",
        message,
        type: "error",
      });
    } finally {
      setOpeningCaseId(null);
    }
  }

  function clearFilters() {
    setSearchQuery("");
    setStatusFilter("All");
    setSeverityFilter("All");
    setSortOption(
      "Recently Updated",
    );

    showToast({
      title: "Filters cleared",
      message:
        "All investigation cases are now visible.",
      type: "info",
      duration: 2200,
    });
  }

  return (
  
        <div className="min-h-screen bg-slate-900 p-4 text-white sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-blue-500/15 p-3">
              <ClipboardList className="h-8 w-8 text-blue-400" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                SentinelAI SOC Workflow
              </p>

              <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
                Investigation Case Queue
              </h1>

              <p className="mt-2 max-w-3xl text-slate-400">
                Search, filter, prioritize, and reopen saved
                SOC investigation cases stored in SQLite.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadCases(true)
            }
            disabled={isLoading}
            className="flex items-center gap-2 rounded-lg border border-slate-600 px-5 py-3 font-medium text-slate-200 transition hover:border-blue-500 hover:text-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw
              className={`h-5 w-5 ${
                isLoading
                  ? "animate-spin"
                  : ""
              }`}
            />

            Refresh Cases
          </button>
        </header>

        {errorMessage && (
          <section className="mt-6 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <p className="text-sm leading-6">
              {errorMessage}
            </p>
          </section>
        )}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            label="Total Cases"
            value={statistics.total}
            valueClass="text-blue-400"
            icon={ClipboardList}
            isActive={
              statusFilter === "All"
            }
            onClick={() =>
              setStatusFilter("All")
            }
          />

          <SummaryCard
            label="Open"
            value={statistics.open}
            valueClass="text-red-400"
            icon={ShieldAlert}
            isActive={
              statusFilter === "Open"
            }
            onClick={() =>
              setStatusFilter("Open")
            }
          />

          <SummaryCard
            label="In Progress"
            value={statistics.inProgress}
            valueClass="text-amber-400"
            icon={Clock3}
            isActive={
              statusFilter ===
              "In Progress"
            }
            onClick={() =>
              setStatusFilter(
                "In Progress",
              )
            }
          />

          <SummaryCard
            label="Resolved"
            value={statistics.resolved}
            valueClass="text-green-400"
            icon={CheckCircle2}
            isActive={
              statusFilter === "Resolved"
            }
            onClick={() =>
              setStatusFilter("Resolved")
            }
          />

          <SummaryCard
            label="False Positives"
            value={statistics.falsePositive}
            valueClass="text-slate-300"
            icon={XCircle}
            isActive={
              statusFilter ===
              "False Positive"
            }
            onClick={() =>
              setStatusFilter(
                "False Positive",
              )
            }
          />
        </section>

        <section className="mt-8 rounded-xl border border-slate-700 bg-slate-800 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/15 p-2">
              <SlidersHorizontal className="h-5 w-5 text-purple-400" />
            </div>

            <div>
              <h2 className="font-semibold text-white">
                Queue Controls
              </h2>

              <p className="text-sm text-slate-400">
                Search, filter, and prioritize the
                investigation workload.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_200px_200px_220px]">
            <label className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

              <input
                type="text"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(
                    event.target.value,
                  )
                }
                placeholder="Search case ID, detection, IP, MITRE, analyst, filename, or notes..."
                className="w-full rounded-lg border border-slate-600 bg-slate-950 py-3 pl-12 pr-4 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
              />
            </label>

            <label className="relative">
              <Filter className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target
                      .value as StatusFilter,
                  )
                }
                className="w-full appearance-none rounded-lg border border-slate-600 bg-slate-950 py-3 pl-12 pr-4 text-white outline-none transition focus:border-blue-500"
              >
                <option value="All">
                  All statuses
                </option>

                <option value="Open">
                  Open
                </option>

                <option value="In Progress">
                  In Progress
                </option>

                <option value="Resolved">
                  Resolved
                </option>

                <option value="False Positive">
                  False Positive
                </option>
              </select>
            </label>

            <label className="relative">
              <ShieldAlert className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

              <select
                value={severityFilter}
                onChange={(event) =>
                  setSeverityFilter(
                    event.target
                      .value as SeverityFilter,
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

                <option value="High">
                  High
                </option>

                <option value="Medium">
                  Medium
                </option>

                <option value="Low">
                  Low
                </option>
              </select>
            </label>

            <label className="relative">
              <SlidersHorizontal className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

              <select
                value={sortOption}
                onChange={(event) =>
                  setSortOption(
                    event.target
                      .value as SortOption,
                  )
                }
                className="w-full appearance-none rounded-lg border border-slate-600 bg-slate-950 py-3 pl-12 pr-4 text-white outline-none transition focus:border-blue-500"
              >
                <option value="Recently Updated">
                  Recently updated
                </option>

                <option value="Oldest Updated">
                  Oldest updated
                </option>

                <option value="Highest Severity">
                  Highest severity
                </option>

                <option value="Case ID">
                  Newest case ID
                </option>
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-400">
              Showing{" "}
              <span className="font-semibold text-white">
                {filteredCases.length.toLocaleString()}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-white">
                {cases.length.toLocaleString()}
              </span>{" "}
              cases
            </p>

            {(searchQuery ||
              statusFilter !== "All" ||
              severityFilter !== "All" ||
              sortOption !==
                "Recently Updated") && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-blue-500 hover:bg-blue-500/10 hover:text-blue-300"
              >
                Clear Filters
              </button>
            )}
          </div>
        </section>

        {isLoading ? (
          <LoadingState />
        ) : filteredCases.length > 0 ? (
          <section className="mt-8 space-y-5">
            {filteredCases.map(
              (investigationCase) => (
                <CaseCard
                  key={
                    investigationCase.id
                  }
                  investigationCase={
                    investigationCase
                  }
                  isOpening={
                    openingCaseId ===
                    investigationCase.id
                  }
                  onOpen={() =>
                    void openCase(
                      investigationCase,
                    )
                  }
                />
              ),
            )}
          </section>
        ) : cases.length === 0 ? (
          <EmptyQueue />
        ) : (
          <NoMatchingCases
            onClear={clearFilters}
          />
        )}
      </div>
    </div>
  );
}

type SummaryCardProps = {
  label: string;
  value: number;
  valueClass: string;
  icon: typeof ClipboardList;
  isActive: boolean;
  onClick: () => void;
};

function SummaryCard({
  label,
  value,
  valueClass,
  icon: Icon,
  isActive,
  onClick,
}: SummaryCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-5 text-left transition ${
        isActive
          ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-950/20"
          : "border-slate-700 bg-slate-800 hover:border-slate-500 hover:bg-slate-800/80"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-400">
          {label}
        </p>

        <Icon className="h-5 w-5 text-slate-500" />
      </div>

      <p
        className={`mt-2 text-3xl font-bold ${valueClass}`}
      >
        {value.toLocaleString()}
      </p>
    </button>
  );
}

type CaseCardProps = {
  investigationCase: InvestigationCase;
  isOpening: boolean;
  onOpen: () => void;
};

function CaseCard({
  investigationCase,
  isOpening,
  onOpen,
}: CaseCardProps) {
  const actionTotal =
    investigationCase.analysis?.detections.find(
      (detection) =>
        detection.id ===
        investigationCase.detection_id,
    )?.recommendations.length ?? 0;

  const completedActionCount =
    investigationCase
      .completed_actions.length;

  const completionPercentage =
    actionTotal > 0
      ? Math.min(
          Math.round(
            (completedActionCount /
              actionTotal) *
              100,
          ),
          100,
        )
      : 0;

  return (
    <article className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-lg transition hover:border-slate-600">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="flex min-w-0 items-start gap-4">
          <div className="rounded-lg bg-blue-500/15 p-3">
            <FolderOpen className="h-7 w-7 text-blue-400" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-mono text-sm font-semibold text-blue-400">
                Case #{investigationCase.id}
              </p>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-bold ${
                  statusStyles[
                    investigationCase.status
                  ]
                }`}
              >
                {investigationCase.status}
              </span>

              {investigationCase.detectionSeverity && (
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-bold ${
                    severityStyles[
                      investigationCase
                        .detectionSeverity
                    ]
                  }`}
                >
                  {
                    investigationCase
                      .detectionSeverity
                  }
                </span>
              )}
            </div>

            <h2 className="mt-3 break-words text-2xl font-bold">
              {investigationCase.detectionType}
            </h2>

            <p className="mt-2 break-all text-sm text-slate-400">
              {investigationCase.filename}
            </p>

            {investigationCase.notes ? (
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
                {truncateText(
                  investigationCase.notes,
                  220,
                )}
              </p>
            ) : (
              <p className="mt-4 text-sm italic text-slate-500">
                No analyst notes have been added.
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onOpen}
          disabled={isOpening}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isOpening ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Opening...
            </>
          ) : (
            <>
              <FileSearch className="h-5 w-5" />
              Review Case
            </>
          )}
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <CaseMetric
          label="Source IP"
          value={
            investigationCase.sourceIp ??
            "Unavailable"
          }
          valueClass="font-mono text-red-300"
        />

        <CaseMetric
          label="MITRE ATT&CK"
          value={
            investigationCase.mitreId ??
            "Unavailable"
          }
          valueClass="text-blue-300"
        />

        <CaseMetric
          label="Assigned Analyst"
          value={
            investigationCase.analyst ||
            "Unassigned"
          }
          valueClass="text-purple-300"
          icon={UserRound}
        />

        <CaseMetric
          label="Actions Completed"
          value={
            actionTotal > 0
              ? `${completedActionCount}/${actionTotal}`
              : String(
                  completedActionCount,
                )
          }
          valueClass="text-green-300"
        />

        <CaseMetric
          label="Analysis ID"
          value={`#${investigationCase.analysis_id}`}
          valueClass="font-mono text-blue-300"
        />

        <CaseMetric
          label="Last Updated"
          value={formatDate(
            investigationCase.updated_at,
          )}
        />
      </div>

      {actionTotal > 0 && (
        <div className="mt-5">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-slate-500">
              Response progress
            </span>

            <span className="font-semibold text-slate-300">
              {completionPercentage}%
            </span>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-950">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-500"
              style={{
                width: `${completionPercentage}%`,
              }}
            />
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-700 pt-4 text-xs text-slate-500">
        <span>
          Created:{" "}
          {formatDate(
            investigationCase.created_at,
          )}
        </span>

        <span>
          Detection ID: #
          {investigationCase.detection_id}
        </span>
      </div>
    </article>
  );
}

type CaseMetricProps = {
  label: string;
  value: string;
  valueClass?: string;
  icon?: typeof UserRound;
};

function CaseMetric({
  label,
  value,
  valueClass = "text-white",
  icon: Icon,
}: CaseMetricProps) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-700 bg-slate-950/50 p-4">
      <div className="flex items-center gap-2">
        {Icon && (
          <Icon className="h-4 w-4 shrink-0 text-slate-500" />
        )}

        <p className="text-sm text-slate-400">
          {label}
        </p>
      </div>

      <p
        className={`mt-2 break-words font-bold ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <section className="mt-8 rounded-xl border border-slate-700 bg-slate-800 p-16 text-center">
      <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-400" />

      <h2 className="mt-5 text-xl font-bold">
        Loading investigation cases
      </h2>

      <p className="mt-2 text-slate-400">
        SentinelAI is retrieving cases and related
        evidence from SQLite.
      </p>
    </section>
  );
}

function EmptyQueue() {
  return (
    <section className="mt-8 rounded-xl border border-dashed border-slate-600 bg-slate-800 p-14 text-center">
      <ClipboardList className="mx-auto h-14 w-14 text-blue-400" />

      <h2 className="mt-5 text-2xl font-bold">
        No saved investigation cases
      </h2>

      <p className="mx-auto mt-3 max-w-xl text-slate-400">
        Open an analysis, investigate a detection,
        and click Save Investigation. The case will
        then appear in this queue.
      </p>
    </section>
  );
}

type NoMatchingCasesProps = {
  onClear: () => void;
};

function NoMatchingCases({
  onClear,
}: NoMatchingCasesProps) {
  return (
    <section className="mt-8 rounded-xl border border-dashed border-slate-600 bg-slate-800 p-14 text-center">
      <Search className="mx-auto h-14 w-14 text-slate-500" />

      <h2 className="mt-5 text-2xl font-bold">
        No matching cases
      </h2>

      <p className="mt-3 text-slate-400">
        Change the search text, status, severity, or
        sorting controls.
      </p>

      <button
        type="button"
        onClick={onClear}
        className="mt-6 rounded-lg bg-blue-600 px-5 py-3 font-medium transition hover:bg-blue-700"
      >
        Clear Filters
      </button>
    </section>
  );
}

function getTimestamp(
  value: string | null,
): number {
  if (!value) {
    return 0;
  }

  const timestamp =
    new Date(value).getTime();

  return Number.isNaN(timestamp)
    ? 0
    : timestamp;
}

function formatDate(
  value: string | null,
): string {
  if (!value) {
    return "Unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function truncateText(
  value: string,
  maximumLength: number,
): string {
  const normalizedValue =
    value.trim();

  if (
    normalizedValue.length <=
    maximumLength
  ) {
    return normalizedValue;
  }

  return `${normalizedValue.slice(
    0,
    maximumLength,
  )}…`;
}

export default CaseQueue;
