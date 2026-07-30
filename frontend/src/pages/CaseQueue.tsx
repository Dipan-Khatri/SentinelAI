import {
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
  UserRound,
} from "lucide-react";

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


type InvestigationCase = Investigation & {
  analysis: HistoricalAnalysisDetail | null;
  detectionType: string;
  detectionSeverity: RiskLevel | null;
  sourceIp: string | null;
  mitreId: string | null;
  filename: string;
};


type StatusFilter =
  | "All"
  | InvestigationStatus;


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


function CaseQueue() {
  const navigate = useNavigate();

  const [cases, setCases] = useState<
    InvestigationCase[]
  >([]);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("All");

  const [isLoading, setIsLoading] =
    useState(true);

  const [openingCaseId, setOpeningCaseId] =
    useState<number | null>(null);

  const [errorMessage, setErrorMessage] =
    useState("");


  async function loadCases() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const investigations =
        await getInvestigations();

      const uniqueAnalysisIds = Array.from(
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
              getAnalysisById(analysisId),
          ),
        );

      const analysisMap = new Map<
        number,
        HistoricalAnalysisDetail
      >();

      analysisResults.forEach(
        (result, index) => {
          if (result.status === "fulfilled") {
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
                (currentDetection) =>
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
                detection?.severity ?? null,

              sourceIp:
                detection?.source_ip ?? null,

              mitreId:
                detection?.mitre_id ?? null,

              filename:
                analysis?.filename ??
                "Analysis unavailable",
            };
          },
        );

      setCases(enrichedCases);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "SentinelAI could not load the investigation queue.",
      );
    } finally {
      setIsLoading(false);
    }
  }


  useEffect(() => {
    void loadCases();
  }, []);


  const filteredCases = useMemo(() => {
    const normalizedSearch =
      searchQuery.trim().toLowerCase();

    return cases.filter(
      (investigationCase) => {
        const matchesStatus =
          statusFilter === "All" ||
          investigationCase.status ===
            statusFilter;

        const searchableValues = [
          String(investigationCase.id),
          investigationCase.detectionType,
          investigationCase.sourceIp ?? "",
          investigationCase.mitreId ?? "",
          investigationCase.analyst,
          investigationCase.notes,
          investigationCase.filename,
          investigationCase.status,
        ];

        const matchesSearch =
          normalizedSearch === "" ||
          searchableValues.some((value) =>
            value
              .toLowerCase()
              .includes(normalizedSearch),
          );

        return (
          matchesStatus &&
          matchesSearch
        );
      },
    );
  }, [
    cases,
    searchQuery,
    statusFilter,
  ]);


  const statistics = useMemo(() => {
    return {
      total: cases.length,

      open: cases.filter(
        (investigationCase) =>
          investigationCase.status === "Open",
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
    };
  }, [cases]);


  async function openCase(
    investigationCase: InvestigationCase,
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
        JSON.stringify(activeAnalysis),
      );

      navigate("/investigations");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "SentinelAI could not open this case.",
      );
    } finally {
      setOpeningCaseId(null);
    }
  }


  return (
    <div className="min-h-screen bg-slate-900 p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-blue-500/15 p-3">
              <ClipboardList className="h-8 w-8 text-blue-400" />
            </div>

            <div>
              <h1 className="text-4xl font-bold">
                Investigation Case Queue
              </h1>

              <p className="mt-2 max-w-3xl text-slate-400">
                Search, review, and reopen saved SOC
                investigation cases stored in SQLite.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadCases()
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

            <p>{errorMessage}</p>
          </section>
        )}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Total Cases"
            value={statistics.total}
            valueClass="text-blue-400"
            icon={ClipboardList}
          />

          <SummaryCard
            label="Open"
            value={statistics.open}
            valueClass="text-red-400"
            icon={ShieldAlert}
          />

          <SummaryCard
            label="In Progress"
            value={statistics.inProgress}
            valueClass="text-amber-400"
            icon={Clock3}
          />

          <SummaryCard
            label="Resolved"
            value={statistics.resolved}
            valueClass="text-green-400"
            icon={CheckCircle2}
          />
        </section>

        <section className="mt-8 rounded-xl border border-slate-700 bg-slate-800 p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
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
                placeholder="Search by case ID, detection, IP, analyst, MITRE ID, filename, or notes..."
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
          </div>
        </section>

        {isLoading ? (
          <LoadingState />
        ) : filteredCases.length > 0 ? (
          <section className="mt-8 space-y-5">
            {filteredCases.map(
              (investigationCase) => (
                <CaseCard
                  key={investigationCase.id}
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
            onClear={() => {
              setSearchQuery("");
              setStatusFilter("All");
            }}
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
};


function SummaryCard({
  label,
  value,
  valueClass,
  icon: Icon,
}: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          {label}
        </p>

        <Icon className="h-5 w-5 text-slate-500" />
      </div>

      <p
        className={`mt-2 text-3xl font-bold ${valueClass}`}
      >
        {value}
      </p>
    </div>
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
  return (
    <article className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-lg">
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
              {
                investigationCase
                  .detectionType
              }
            </h2>

            <p className="mt-2 break-all text-sm text-slate-400">
              {investigationCase.filename}
            </p>

            {investigationCase.notes && (
              <p className="mt-4 max-w-3xl line-clamp-2 text-sm leading-6 text-slate-300">
                {investigationCase.notes}
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
              Open Case
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
          value={investigationCase.analyst}
          valueClass="text-purple-300"
          icon={UserRound}
        />

        <CaseMetric
          label="Actions Completed"
          value={String(
            investigationCase
              .completed_actions.length,
          )}
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
    <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-4">
      <div className="flex items-center gap-2">
        {Icon && (
          <Icon className="h-4 w-4 text-slate-500" />
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
        SentinelAI is retrieving cases and
        related evidence from SQLite.
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
        then appear here.
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
        Change the search text or status filter.
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


export default CaseQueue;
