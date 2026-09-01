import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  CalendarClock,
  Database,
  LoaderCircle,
  RefreshCcw,
  Search,
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



function getAnalysisRisk(
  analysis: AnalysisHistoryItem,
): RiskLevel {

  const risk =
    analysis.risk_level ??
    analysis.severity ??
    "Low";

  return risk as RiskLevel;
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

    default:
      return "text-slate-300";
  }
}
function History() {

  const navigate = useNavigate();


  const [analyses, setAnalyses] = useState<
    AnalysisHistoryItem[]
  >([]);


  const [searchQuery, setSearchQuery] =
    useState("");


  const [riskFilter, setRiskFilter] =
    useState<"All" | RiskLevel>("All");


  const [isLoading, setIsLoading] =
    useState(true);
 


  const [error, setError] =
    useState("");


  const [successMessage, setSuccessMessage] =
    useState("");

const [openingId, setOpeningId] =
  useState<number | null>(null);


const [deletingId, setDeletingId] =
  useState<number | null>(null);


  async function loadAnalyses() {

    setIsLoading(true);

    setError("");

    try {

      const records = await getAnalyses();

      setAnalyses(records);

    } catch (loadError) {

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load analysis history.",
      );

    } finally {

      setIsLoading(false);

    }
  }



  useEffect(() => {

    void loadAnalyses();

  }, []);




  const filteredAnalyses = useMemo(() => {


    const normalizedSearch =
      searchQuery
        .trim()
        .toLowerCase();



    return analyses.filter((analysis) => {


      const risk =
        getAnalysisRisk(analysis);



      const matchesRisk =
        riskFilter === "All" ||
        risk === riskFilter;



      const matchesSearch =
        normalizedSearch === "" ||
        analysis.filename
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(analysis.id)
          .includes(normalizedSearch) ||
        risk
          .toLowerCase()
          .includes(normalizedSearch);



      return (
        matchesRisk &&
        matchesSearch
      );

    });


  }, [
    analyses,
    riskFilter,
    searchQuery,
  ]);




  const statistics = useMemo(() => {


    return {


      total:
        analyses.length,



      critical:
        analyses.filter(
          (analysis) =>
            getAnalysisRisk(analysis) === "Critical",
        ).length,



      high:
        analyses.filter(
          (analysis) =>
            getAnalysisRisk(analysis) === "High",
        ).length,



      detections:
        analyses.reduce(
          (
            total,
            analysis,
          ) =>
            total +
            (
              analysis.detections ??
              analysis.detection_count ??
              0
            ),

          0,
        ),


    };


  }, [analyses]);




  async function openAnalysis(
    analysisId: number,
  ) {

    setOpeningId(analysisId);

    setError("");


    try {

      const historicalAnalysis =
        await getAnalysisById(
          analysisId,
        );


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
          : "Could not open analysis.",
      );


    } finally {


      setOpeningId(null);


    }

  }

  async function removeAnalysis(
    analysis: AnalysisHistoryItem,
  ) {

    const confirmed = window.confirm(
      `Delete analysis #${analysis.id}?`,
    );


    if (!confirmed) {
      return;
    }


    setDeletingId(analysis.id);

    setError("");

    setSuccessMessage("");


    try {

      await deleteAnalysis(
        analysis.id,
      );


      setAnalyses((current) =>
        current.filter(
          (item) =>
            item.id !== analysis.id,
        ),
      );


      setSuccessMessage(
        "Analysis deleted successfully.",
      );


    } catch (deleteError) {


      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete analysis.",
      );


    } finally {


      setDeletingId(null);


    }

  }



  return (

    <div className="min-h-screen bg-slate-900 p-8 text-white">

      <div className="mx-auto max-w-7xl">


        <header className="flex flex-wrap items-start justify-between gap-5">

          <div>

            <h1 className="text-4xl font-bold">
              Analysis History
            </h1>


            <p className="mt-2 text-slate-400">
              Review saved SentinelAI security analyses.
            </p>

          </div>



          <button
            onClick={() => void loadAnalyses()}
            className="flex items-center gap-2 rounded-lg border border-slate-600 px-5 py-3"
          >

            <RefreshCcw className="h-5 w-5" />

            Refresh

          </button>


        </header>



        {error && (

          <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300">

            {error}

          </div>

        )}



        {successMessage && (

          <div className="mt-6 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-green-300">

            {successMessage}

          </div>

        )}



        <section className="mt-8 grid gap-4 sm:grid-cols-3">


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
            label="Total Detections"
            value={statistics.detections}
            valueClass="text-purple-400"
          />


        </section>




        <section className="mt-8 rounded-xl border border-slate-700 bg-slate-800 p-5">


          <div className="flex gap-4">


            <Search className="mt-3 text-slate-500" />


            <input
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(e.target.value)
              }
              placeholder="Search analysis..."
              className="w-full rounded-lg border border-slate-600 bg-slate-950 p-3"
            />


            <select
              value={riskFilter}
              onChange={(e) =>
                setRiskFilter(
                  e.target.value as
                    | "All"
                    | RiskLevel,
                )
              }
              className="rounded-lg border border-slate-600 bg-slate-950 px-4"
            >

              <option value="All">
                All
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


          </div>


        </section>





        {isLoading ? (

          <LoadingState />

        ) : filteredAnalyses.length === 0 ? (

          <EmptyHistory />

        ) : (


          <section className="mt-8 space-y-5">


            {filteredAnalyses.map((analysis) => (

              <article
                key={analysis.id}
                className="rounded-xl border border-slate-700 bg-slate-800 p-6"
              >


                <div className="flex justify-between">


                  <div>


                    <p className="text-blue-400">
                      Analysis #{analysis.id}
                    </p>


                    <h2 className="text-2xl font-bold">
                      {analysis.filename}
                    </h2>


                    <p className="mt-2 text-slate-400">

                      <CalendarClock className="inline h-4 w-4 mr-2"/>

                      {formatDate(
                        analysis.created_at ??
                        analysis.upload_time,
                      )}

                    </p>


                  </div>



                  <span
                    className={`rounded-full border px-3 py-1 ${
                      riskStyles[
                        getAnalysisRisk(analysis)
                      ]
                    }`}
                  >

                    {getAnalysisRisk(analysis)}

                  </span>


                </div>



                <div className="mt-6 grid gap-4 md:grid-cols-4">


                  <HistoryMetric
                    label="Risk Score"
                    value={`${analysis.risk_score ?? 0}/100`}
                    valueClass={getRiskValueClass(
                      getAnalysisRisk(analysis),
                    )}
                  />


                  <HistoryMetric
                    label="Detections"
                    value={String(
                      analysis.detections ??
                      analysis.detection_count ??
                      0
                    )}
                  />


                  <HistoryMetric
                    label="Log Entries"
                    value={String(
                      analysis.total_events ??
                      analysis.entries ??
                      0
                    )}
                  />


                  <HistoryMetric
                    label="Failed Logins"
                    value={String(
                      analysis.failed_logins ?? 0
                    )}
                  />


                </div>



                <div className="mt-5 flex gap-3">


             <button
  onClick={() => {
    void openAnalysis(analysis.id)
  }}
  disabled={openingId === analysis.id}
  className="rounded-lg bg-blue-600 px-5 py-3 disabled:opacity-50"
>
  {openingId === analysis.id
    ? "Opening..."
    : "Open Analysis"}
</button> 
<button
  onClick={() => {
    void removeAnalysis(analysis)
  }}
  disabled={deletingId === analysis.id}
  className="rounded-lg border border-red-500 px-5 py-3 text-red-300 disabled:opacity-50"
>
  {deletingId === analysis.id
    ? "Deleting..."
    : "Delete"}
</button>

                </div>



              </article>

            ))}


          </section>


        )}


      </div>

    </div>

  );
}
function SummaryCard({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: number;
  valueClass: string;
}) {

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">

      <p className="text-slate-400">
        {label}
      </p>

      <p className={`mt-2 text-3xl font-bold ${valueClass}`}>
        {value}
      </p>

    </div>
  );
}



function HistoryMetric({
  label,
  value,
  valueClass = "text-white",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950 p-4">

      <p className="text-sm text-slate-400">
        {label}
      </p>

      <p className={`mt-2 text-xl font-bold ${valueClass}`}>
        {value}
      </p>

    </div>
  );
}



function LoadingState() {

  return (
    <div className="mt-8 text-center">

      <LoaderCircle className="mx-auto h-10 w-10 animate-spin"/>

      <p className="mt-3">
        Loading analysis history...
      </p>

    </div>
  );
}



function EmptyHistory() {

  return (
    <div className="mt-8 rounded-xl border border-slate-700 bg-slate-800 p-10 text-center">

      <Database className="mx-auto h-12 w-12"/>

      <h2 className="mt-4 text-2xl font-bold">
        No saved analyses
      </h2>

    </div>
  );
}



function formatDate(
  value?: string | null,
) {

  if (!value) {
    return "Unknown date";
  }

  return new Date(value)
    .toLocaleString();

}



export default History;
