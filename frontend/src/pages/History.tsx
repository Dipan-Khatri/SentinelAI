import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Database,
  FileSearch,
  FileText,
  LoaderCircle,
  RefreshCcw,
  Search,

  Trash2,
} from "lucide-react";

import {
  deleteAnalysis,
  getAnalyses,
  getAnalysisById,
  historicalAnalysisToUploadResult,
  type AnalysisHistoryItem,
  type RiskLevel,
} from "../services/api";

const LATEST_ANALYSIS_STORAGE_KEY =
  "sentinelai_latest_analysis";

const riskStyles: Record<RiskLevel, string> = {
  Critical:
    "border-red-500/40 bg-red-500/15 text-red-300",
  High:
    "border-orange-500/40 bg-orange-500/15 text-orange-300",
  Medium:
    "border-amber-500/40 bg-amber-500/15 text-amber-300",
  Low:
    "border-green-500/40 bg-green-500/15 text-green-300",
};

function History() {
  const navigate = useNavigate();

  const [analyses, setAnalyses] = useState<
    AnalysisHistoryItem[]
  >([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<
    "All" | RiskLevel
  >("All");

  const [isLoading, setIsLoading] = useState(true);
  const [openingId, setOpeningId] = useState<
    number | null
  >(null);

  const [deletingId, setDeletingId] = useState<
    number | null
  >(null);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  async function loadAnalyses() {
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const records = await getAnalyses();
      setAnalyses(records);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "SentinelAI could not load analysis history.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadAnalyses();
  }, []);

  const filteredAnalyses = useMemo(() => {
    const normalizedSearch = searchQuery
      .trim()
      .toLowerCase();

    return analyses.filter((analysis) => {
      const matchesRisk =
        riskFilter === "All" ||
        analysis.risk_level === riskFilter;

      const matchesSearch =
        normalizedSearch === "" ||
        analysis.filename
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(analysis.id).includes(normalizedSearch) ||
        analysis.risk_level
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesRisk && matchesSearch;
    });
  }, [analyses, riskFilter, searchQuery]);

  const statistics = useMemo(() => {
    return {
      total: analyses.length,

      critical: analyses.filter(
        (analysis) =>
          analysis.risk_level === "Critical",
      ).length,

      high: analyses.filter(
        (analysis) => analysis.risk_level === "High",
      ).length,

detections: analyses.reduce(
  (total, analysis) =>
    total + (analysis.detection_count ?? 0),
  0,
),

    };
  }, [analyses]);

  async function openAnalysis(analysisId: number) {
    setOpeningId(analysisId);
    setError("");
    setSuccessMessage("");

    try {
      const historicalAnalysis =
        await getAnalysisById(analysisId);

      const activeAnalysis =
        historicalAnalysisToUploadResult(
          historicalAnalysis,
        );

      localStorage.setItem(
        LATEST_ANALYSIS_STORAGE_KEY,
        JSON.stringify(activeAnalysis),
      );

      navigate("/");
    } catch (openError) {
      setError(
        openError instanceof Error
          ? openError.message
          : "SentinelAI could not open this analysis.",
      );
    } finally {
      setOpeningId(null);
    }
  }

  async function removeAnalysis(
    analysis: AnalysisHistoryItem,
  ) {
    const shouldDelete = window.confirm(
      `Delete analysis #${analysis.id} for ${analysis.filename}? This cannot be undone.`,
    );

    if (!shouldDelete) {
      return;
    }

    setDeletingId(analysis.id);
    setError("");
    setSuccessMessage("");

    try {
      await deleteAnalysis(analysis.id);

      setAnalyses((currentAnalyses) =>
        currentAnalyses.filter(
          (currentAnalysis) =>
            currentAnalysis.id !== analysis.id,
        ),
      );

      setSuccessMessage(
        `Analysis #${analysis.id} was deleted successfully.`,
      );
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "SentinelAI could not delete this analysis.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-blue-500/15 p-3">
              <Database className="h-8 w-8 text-blue-400" />
            </div>

            <div>
              <h1 className="text-4xl font-bold">
                Analysis History
              </h1>

              <p className="mt-2 max-w-3xl text-slate-400">
                Review, reopen, and manage security analyses
                stored permanently in the SentinelAI database.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void loadAnalyses()}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-lg border border-slate-600 px-5 py-3 font-medium text-slate-200 transition hover:border-blue-500 hover:text-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw
              className={`h-5 w-5 ${
                isLoading ? "animate-spin" : ""
              }`}
            />

            Refresh History
          </button>
        </header>

        {error && (
          <div className="mt-6 flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mt-6 flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-green-300">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <p>{successMessage}</p>
          </div>
        )}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Saved Analyses"
            value={statistics.total}
            valueClass="text-blue-400"
          />

          <SummaryCard
            label="Critical Risk"
            value={statistics.critical}
            valueClass="text-red-400"
          />

          <SummaryCard
            label="High Risk"
            value={statistics.high}
            valueClass="text-orange-400"
          />

          <SummaryCard
            label="Total Detections"
            value={statistics.detections}
            valueClass="text-purple-400"
          />
        </section>

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
                placeholder="Search by filename, analysis ID, or risk level..."
                className="w-full rounded-lg border border-slate-600 bg-slate-950 py-3 pl-12 pr-4 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
              />
            </label>

            <select
              value={riskFilter}
              onChange={(event) =>
                setRiskFilter(
                  event.target.value as
                    | "All"
                    | RiskLevel,
                )
              }
              className="rounded-lg border border-slate-600 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
            >
              <option value="All">All risk levels</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </section>

        {isLoading ? (
          <LoadingState />
        ) : filteredAnalyses.length > 0 ? (
          <section className="mt-8 space-y-5">
            {filteredAnalyses.map((analysis) => (
              <article
                key={analysis.id}
                className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-lg"
              >
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-blue-500/15 p-3">
                      <FileText className="h-7 w-7 text-blue-400" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-mono text-sm font-semibold text-blue-400">
                          Analysis #{analysis.id}
                        </p>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${
                            riskStyles[
                              analysis.risk_level
                            ]
                          }`}
                        >
                          {analysis.risk_level} Risk
                        </span>
                      </div>

                      <h2 className="mt-2 break-all text-2xl font-bold">
                        {analysis.filename}
                      </h2>

                      <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
                        <CalendarClock className="h-4 w-4" />

                        <span>
                   {formatDate(
  analysis.created_at ?? analysis.upload_time,
)}

                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        void openAnalysis(analysis.id)
                      }
                      disabled={
                        openingId === analysis.id ||
                        deletingId === analysis.id
                      }
                      className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {openingId === analysis.id ? (
                        <>
                          <LoaderCircle className="h-5 w-5 animate-spin" />
                          Opening...
                        </>
                      ) : (
                        <>
                          <FileSearch className="h-5 w-5" />
                          Open Analysis
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void removeAnalysis(analysis)
                      }
                      disabled={
                        deletingId === analysis.id ||
                        openingId === analysis.id
                      }
                      className="flex items-center gap-2 rounded-lg border border-red-500/40 px-5 py-3 font-medium text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingId === analysis.id ? (
                        <LoaderCircle className="h-5 w-5 animate-spin" />
                      ) : (
                        <Trash2 className="h-5 w-5" />
                      )}

                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                  <HistoryMetric
                    label="Risk Score"
                    value={`${analysis.risk_score}/100`}
                    valueClass={getRiskValueClass(
                      analysis.risk_level,
                    )}
                  />

                  <HistoryMetric
                    label="Detections"
                    value={(analysis.detection_count ?? 0).toString()}

                    valueClass="text-red-300"
                  />
<HistoryMetric
  label="Log Entries"
  value={(analysis.total_events ?? analysis.entries ?? 0).toLocaleString()}
/>

<HistoryMetric
  label="Failed Logins"
  value={(analysis.failed_logins ?? 0).toLocaleString()}
  valueClass="text-orange-300"
/>


                 <HistoryMetric
  label="Successful"
  value={(analysis.successful_logins ?? 0).toLocaleString()}
  valueClass="text-green-300"
/>


                  <HistoryMetric
                    label="Database ID"
                    value={`#${analysis.id}`}
                    valueClass="font-mono text-blue-300"
                  />
                </div>
              </article>
            ))}
          </section>
        ) : analyses.length === 0 ? (
          <EmptyHistory />
        ) : (
          <NoSearchResults
            onClear={() => {
              setSearchQuery("");
              setRiskFilter("All");
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

type HistoryMetricProps = {
  label: string;
  value: string;
  valueClass?: string;
};

function HistoryMetric({
  label,
  value,
  valueClass = "text-white",
}: HistoryMetricProps) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-4">
      <p className="text-sm text-slate-400">
        {label}
      </p>

      <p
        className={`mt-2 break-words text-xl font-bold ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <section className="mt-8 rounded-xl border border-slate-700 bg-slate-800 p-16 text-center">
      <LoaderCircle className="mx-auto h-12 w-12 animate-spin text-blue-400" />

      <h2 className="mt-5 text-xl font-bold">
        Loading analysis history
      </h2>

      <p className="mt-2 text-slate-400">
        SentinelAI is retrieving saved records from SQLite.
      </p>
    </section>
  );
}

function EmptyHistory() {
  return (
    <section className="mt-8 rounded-xl border border-dashed border-slate-600 bg-slate-800 p-14 text-center">
      <Database className="mx-auto h-14 w-14 text-blue-400" />

      <h2 className="mt-5 text-2xl font-bold">
        No saved analyses
      </h2>

      <p className="mx-auto mt-3 max-w-xl text-slate-400">
        Upload and analyze a security log. SentinelAI will
        automatically save the completed analysis in SQLite.
      </p>
    </section>
  );
}

type NoSearchResultsProps = {
  onClear: () => void;
};

function NoSearchResults({
  onClear,
}: NoSearchResultsProps) {
  return (
    <section className="mt-8 rounded-xl border border-dashed border-slate-600 bg-slate-800 p-14 text-center">
      <Search className="mx-auto h-14 w-14 text-slate-500" />

      <h2 className="mt-5 text-2xl font-bold">
        No matching analyses
      </h2>

      <p className="mt-3 text-slate-400">
        Change the search text or risk filter.
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

function formatDate(value?: string | null): string {
  if (!value) {
    return "Upload time unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}


function getRiskValueClass(
  riskLevel: RiskLevel,
): string {
  switch (riskLevel) {
    case "Critical":
      return "text-red-300";

    case "High":
      return "text-orange-300";

    case "Medium":
      return "text-amber-300";

    case "Low":
      return "text-green-300";
  }
}

export default History;
