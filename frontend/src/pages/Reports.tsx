import {
  AlertTriangle,
  Download,
  FileText,
  Loader2,
  RefreshCcw,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import AnalystPerformance from "../components/reports/AnalystPerformance";
import ExecutiveExport from "../components/reports/ExecutiveExport";
import ExecutiveOverview from "../components/reports/ExecutiveOverview";
import MitreCoverage from "../components/reports/MitreCoverage";
import ThreatTrendChart from "../components/reports/ThreatTrendChart";
import TopThreatActors from "../components/reports/TopThreatActors";

import {
  getInvestigations,
  type Investigation,
  type UploadResult,
} from "../services/api";

const ANALYSIS_STORAGE_KEY =
  "sentinelai_latest_analysis";

type PdfDocumentWithTable = jsPDF & {
  lastAutoTable?: {
    finalY: number;
  };
};

function Reports() {
  const [analysis, setAnalysis] =
    useState<UploadResult | null>(null);

  const [
    investigations,
    setInvestigations,
  ] = useState<Investigation[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [
    isGenerating,
    setIsGenerating,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  async function loadReportData() {
    setIsLoading(true);
    setErrorMessage("");

    const savedAnalysis =
      localStorage.getItem(
        ANALYSIS_STORAGE_KEY,
      );

    if (!savedAnalysis) {
      setAnalysis(null);
      setInvestigations([]);
      setIsLoading(false);
      return;
    }

    try {
      const parsedAnalysis =
        JSON.parse(
          savedAnalysis,
        ) as UploadResult;

      setAnalysis(parsedAnalysis);

    const savedInvestigations =
  await getInvestigations();

      setInvestigations(
        savedInvestigations,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "SentinelAI could not load report data.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadReportData();
  }, []);

  const highestRiskIp =
    useMemo(() => {
      if (
        !analysis ||
        analysis.suspicious_ips.length === 0
      ) {
        return null;
      }

      return [
        ...analysis.suspicious_ips,
      ].sort(
        (
          firstIp,
          secondIp,
        ) =>
          secondIp.attempts -
          firstIp.attempts,
      )[0];
    }, [analysis]);

  const affectedUsers =
    useMemo(() => {
      if (!analysis) {
        return [];
      }

      return Array.from(
        new Set(
          analysis.detections.flatMap(
            (detection) =>
              detection.affected_users ??
              [],
          ),
        ),
      );
    }, [analysis]);

  async function generatePdfReport() {
    if (!analysis) {
      return;
    }

    setIsGenerating(true);
    setErrorMessage("");

    try {
      const document =
        new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        }) as PdfDocumentWithTable;

      const generatedAt =
        new Date();

      const pageWidth =
        document.internal.pageSize.getWidth();

      const pageHeight =
        document.internal.pageSize.getHeight();

      const margin = 16;

      const contentWidth =
        pageWidth - margin * 2;

      function getTableEndY(
        fallbackY: number,
      ) {
        return (
          document.lastAutoTable
            ?.finalY ?? fallbackY
        );
      }

      function ensurePageSpace(
        currentY: number,
        requiredSpace: number,
      ) {
        if (
          currentY +
            requiredSpace >
          pageHeight - 20
        ) {
          document.addPage();
          return 20;
        }

        return currentY;
      }

      function addSectionTitle(
        title: string,
        yPosition: number,
      ) {
        document.setFont(
          "helvetica",
          "bold",
        );

        document.setFontSize(14);

        document.setTextColor(
          15,
          23,
          42,
        );

        document.text(
          title,
          margin,
          yPosition,
        );

        document.setDrawColor(
          37,
          99,
          235,
        );

        document.setLineWidth(0.5);

        document.line(
          margin,
          yPosition + 2,
          pageWidth - margin,
          yPosition + 2,
        );
      }

      document.setFillColor(
        15,
        23,
        42,
      );

      document.rect(
        0,
        0,
        pageWidth,
        54,
        "F",
      );

      document.setFont(
        "helvetica",
        "bold",
      );

      document.setFontSize(12);

      document.setTextColor(
        56,
        189,
        248,
      );

      document.text(
        "SENTINELAI SECURITY OPERATIONS",
        margin,
        16,
      );

      document.setFontSize(23);

      document.setTextColor(
        255,
        255,
        255,
      );

      document.text(
        "Executive SOC Report",
        margin,
        29,
      );

      document.setFont(
        "helvetica",
        "normal",
      );

      document.setFontSize(10);

      document.setTextColor(
        203,
        213,
        225,
      );

      document.text(
        `Source: ${analysis.filename}`,
        margin,
        39,
      );

      document.text(
        `Generated: ${generatedAt.toLocaleString()}`,
        margin,
        46,
      );

      const riskColor =
        getRiskColor(
          analysis.risk_level,
        );

      document.setFillColor(
        riskColor[0],
        riskColor[1],
        riskColor[2],
      );

      document.roundedRect(
        pageWidth - 54,
        18,
        38,
        14,
        3,
        3,
        "F",
      );

      document.setFont(
        "helvetica",
        "bold",
      );

      document.setFontSize(11);

      document.setTextColor(
        255,
        255,
        255,
      );

      document.text(
        analysis.risk_level.toUpperCase(),
        pageWidth - 35,
        27,
        {
          align: "center",
        },
      );

      let currentY = 67;

      addSectionTitle(
        "Executive Summary",
        currentY,
      );

      currentY += 9;

      const executiveSummary =
        buildExecutiveSummary(
          analysis,
          highestRiskIp?.ip,
        );

      document.setFont(
        "helvetica",
        "normal",
      );

      document.setFontSize(10);

      document.setTextColor(
        51,
        65,
        85,
      );

      const summaryLines =
        document.splitTextToSize(
          executiveSummary,
          contentWidth,
        ) as string[];

      document.text(
        summaryLines,
        margin,
        currentY,
        {
          lineHeightFactor: 1.45,
        },
      );

      currentY +=
        summaryLines.length * 6 +
        8;

      currentY =
        ensurePageSpace(
          currentY,
          44,
        );

      addSectionTitle(
        "Executive Metrics",
        currentY,
      );

      autoTable(document, {
        startY: currentY + 6,

        margin: {
          left: margin,
          right: margin,
        },

        head: [
          [
            "Metric",
            "Value",
            "Metric",
            "Value",
          ],
        ],

        body: [
          [
            "Risk Score",
            `${analysis.risk_score}/100`,
            "Risk Level",
            analysis.risk_level,
          ],

          [
            "Total Events",
            analysis.entries.toLocaleString(),
            "Detections",
            analysis.detections.length.toLocaleString(),
          ],

          [
            "Failed Logins",
            analysis.failed_logins.toLocaleString(),
            "Successful Logins",
            analysis.successful_logins.toLocaleString(),
          ],

          [
            "Suspicious IPs",
            analysis.suspicious_ips.length.toLocaleString(),
            "Investigations",
            investigations.length.toLocaleString(),
          ],
        ],

        theme: "grid",

        headStyles: {
          fillColor: [
            30,
            64,
            175,
          ],
          textColor: 255,
          fontStyle: "bold",
        },

        alternateRowStyles: {
          fillColor: [
            241,
            245,
            249,
          ],
        },

        styles: {
          fontSize: 9,
          cellPadding: 3,
          textColor: [
            51,
            65,
            85,
          ],
        },
      });

      currentY =
        getTableEndY(
          currentY + 35,
        ) + 12;
      if (
        analysis.suspicious_ips.length > 0
      ) {
        currentY =
          ensurePageSpace(
            currentY,
            48,
          );

        addSectionTitle(
          "Top Threat Sources",
          currentY,
        );

        autoTable(document, {
          startY: currentY + 6,

          margin: {
            left: margin,
            right: margin,
          },

          head: [
            [
              "IP Address",
              "Attempts",
              "Targeted Accounts",
              "Priority",
            ],
          ],

          body: [
            ...analysis.suspicious_ips,
          ]
            .sort(
              (
                firstSource,
                secondSource,
              ) =>
                secondSource.attempts -
                firstSource.attempts,
            )
            .slice(0, 10)
            .map((source) => [
              source.ip,
              source.attempts.toLocaleString(),
              source.targeted_users
                .join(", ") ||
                "Unknown",
              getIpPriority(
                source.attempts,
              ),
            ]),

          theme: "striped",

          headStyles: {
            fillColor: [
              185,
              28,
              28,
            ],
            textColor: 255,
            fontStyle: "bold",
          },

          alternateRowStyles: {
            fillColor: [
              254,
              242,
              242,
            ],
          },

          styles: {
            fontSize: 8.5,
            cellPadding: 3,
            overflow: "linebreak",
            textColor: [
              51,
              65,
              85,
            ],
          },

          columnStyles: {
            0: {
              cellWidth: 42,
            },

            1: {
              cellWidth: 24,
            },

            2: {
              cellWidth: 78,
            },

            3: {
              cellWidth: 30,
            },
          },
        });

        currentY =
          getTableEndY(
            currentY + 36,
          ) + 12;
      }

      if (
        analysis.detections.length > 0
      ) {
        currentY =
          ensurePageSpace(
            currentY,
            55,
          );

        addSectionTitle(
          "Detection Findings",
          currentY,
        );

        autoTable(document, {
          startY: currentY + 6,

          margin: {
            left: margin,
            right: margin,
          },

          head: [
            [
              "Detection",
              "Severity",
              "MITRE",
              "Confidence",
              "Events",
              "Source IP",
            ],
          ],

          body:
            analysis.detections.map(
              (detection) => [
                detection.type,
                detection.severity,
                detection.mitre_id,
                `${detection.confidence}%`,
                detection.event_count.toLocaleString(),
                detection.source_ip ??
                  "Unavailable",
              ],
            ),

          theme: "grid",

          headStyles: {
            fillColor: [
              109,
              40,
              217,
            ],
            textColor: 255,
            fontStyle: "bold",
          },

          alternateRowStyles: {
            fillColor: [
              250,
              245,
              255,
            ],
          },

          styles: {
            fontSize: 8,
            cellPadding: 2.5,
            overflow: "linebreak",
            textColor: [
              51,
              65,
              85,
            ],
          },

          columnStyles: {
            0: {
              cellWidth: 42,
            },

            1: {
              cellWidth: 22,
            },

            2: {
              cellWidth: 24,
            },

            3: {
              cellWidth: 25,
            },

            4: {
              cellWidth: 18,
            },

            5: {
              cellWidth: 42,
            },
          },
        });

        currentY =
          getTableEndY(
            currentY + 40,
          ) + 12;
      }

      if (
        affectedUsers.length > 0
      ) {
        currentY =
          ensurePageSpace(
            currentY,
            30,
          );

        addSectionTitle(
          "Affected Accounts",
          currentY,
        );

        currentY += 9;

        document.setFont(
          "helvetica",
          "normal",
        );

        document.setFontSize(10);

        document.setTextColor(
          51,
          65,
          85,
        );

        const affectedAccountLines =
          document.splitTextToSize(
            affectedUsers.join(", "),
            contentWidth,
          ) as string[];

        document.text(
          affectedAccountLines,
          margin,
          currentY,
          {
            lineHeightFactor: 1.4,
          },
        );

        currentY +=
          affectedAccountLines.length *
            5.5 +
          10;
      }

      if (
        investigations.length > 0
      ) {
        currentY =
          ensurePageSpace(
            currentY,
            50,
          );

        addSectionTitle(
          "Investigation Performance",
          currentY,
        );

        const openCases =
          investigations.filter(
            (investigation) =>
              investigation.status ===
              "Open",
          ).length;

        const activeCases =
          investigations.filter(
            (investigation) =>
              investigation.status ===
              "In Progress",
          ).length;

        const resolvedCases =
          investigations.filter(
            (investigation) =>
              investigation.status ===
              "Resolved",
          ).length;

        const falsePositiveCases =
          investigations.filter(
            (investigation) =>
              investigation.status ===
              "False Positive",
          ).length;

        const completedActions =
          investigations.reduce(
            (
              total,
              investigation,
            ) =>
              total +
              investigation
                .completed_actions
                .length,
            0,
          );

        autoTable(document, {
          startY: currentY + 6,

          margin: {
            left: margin,
            right: margin,
          },

          head: [
            [
              "Metric",
              "Value",
              "Metric",
              "Value",
            ],
          ],

          body: [
            [
              "Open Cases",
              openCases.toLocaleString(),
              "Active Cases",
              activeCases.toLocaleString(),
            ],

            [
              "Resolved Cases",
              resolvedCases.toLocaleString(),
              "False Positives",
              falsePositiveCases.toLocaleString(),
            ],

            [
              "Completed Actions",
              completedActions.toLocaleString(),
              "Assigned Analysts",
              getUniqueAnalysts(
                investigations,
              ).length.toLocaleString(),
            ],
          ],

          theme: "grid",

          headStyles: {
            fillColor: [
              8,
              145,
              178,
            ],
            textColor: 255,
            fontStyle: "bold",
          },

          alternateRowStyles: {
            fillColor: [
              236,
              254,
              255,
            ],
          },

          styles: {
            fontSize: 9,
            cellPadding: 3,
            textColor: [
              51,
              65,
              85,
            ],
          },
        });

        currentY =
          getTableEndY(
            currentY + 35,
          ) + 12;

        currentY =
          ensurePageSpace(
            currentY,
            55,
          );

        addSectionTitle(
          "Investigation Cases",
          currentY,
        );

        autoTable(document, {
          startY: currentY + 6,

          margin: {
            left: margin,
            right: margin,
          },

          head: [
            [
              "Case",
              "Status",
              "Analyst",
              "Actions",
              "Last Updated",
            ],
          ],

          body:
            investigations.map(
              (investigation) => [
                `#${investigation.id}`,
                investigation.status,
                investigation.analyst ||
                  "Unassigned",
                investigation.completed_actions.length.toLocaleString(),
                formatReportDate(
                  investigation.updated_at,
                ),
              ],
            ),

          theme: "striped",

          headStyles: {
            fillColor: [
              30,
              41,
              59,
            ],
            textColor: 255,
            fontStyle: "bold",
          },

          styles: {
            fontSize: 8,
            cellPadding: 2.5,
            overflow: "linebreak",
            textColor: [
              51,
              65,
              85,
            ],
          },

          columnStyles: {
            0: {
              cellWidth: 18,
            },

            1: {
              cellWidth: 30,
            },

            2: {
              cellWidth: 36,
            },

            3: {
              cellWidth: 22,
            },

            4: {
              cellWidth: 70,
            },
          },
        });

        currentY =
          getTableEndY(
            currentY + 40,
          ) + 12;
      }

      if (
        analysis.timeline.length > 0
      ) {
        currentY =
          ensurePageSpace(
            currentY,
            60,
          );

        addSectionTitle(
          "Recent Security Activity",
          currentY,
        );

        autoTable(document, {
          startY: currentY + 6,

          margin: {
            left: margin,
            right: margin,
          },

          head: [
            [
              "Timestamp",
              "Event",
              "Status",
              "IP",
              "User",
            ],
          ],

          body:
            analysis.timeline
              .slice(0, 30)
              .map((event) => [
                event.timestamp,
                event.title,
                event.status,
                event.ip ?? "—",
                event.user ?? "—",
              ]),

          theme: "striped",

          headStyles: {
            fillColor: [
              2,
              132,
              199,
            ],
            textColor: 255,
            fontStyle: "bold",
          },

          styles: {
            fontSize: 7.5,
            cellPadding: 2.2,
            overflow: "linebreak",
            textColor: [
              51,
              65,
              85,
            ],
          },

          columnStyles: {
            0: {
              cellWidth: 35,
            },

            1: {
              cellWidth: 63,
            },

            2: {
              cellWidth: 25,
            },

            3: {
              cellWidth: 35,
            },

            4: {
              cellWidth: 25,
            },
          },
        });

        currentY =
          getTableEndY(
            currentY + 45,
          ) + 12;
      }

      const recommendations =
        getRecommendations(
          analysis,
        );

      currentY =
        ensurePageSpace(
          currentY,
          48,
        );

      addSectionTitle(
        "Recommended Response Actions",
        currentY,
      );

      currentY += 9;

      document.setFont(
        "helvetica",
        "normal",
      );

      document.setFontSize(10);

      document.setTextColor(
        51,
        65,
        85,
      );

      recommendations.forEach(
        (
          recommendation,
          index,
        ) => {
          currentY =
            ensurePageSpace(
              currentY,
              14,
            );

          const recommendationLines =
            document.splitTextToSize(
              `${index + 1}. ${recommendation}`,
              contentWidth,
            ) as string[];

          document.text(
            recommendationLines,
            margin,
            currentY,
            {
              lineHeightFactor: 1.4,
            },
          );

          currentY +=
            recommendationLines.length *
              5.5 +
            3;
        },
      );

      const pageCount =
        document.getNumberOfPages();

      for (
        let pageNumber = 1;
        pageNumber <= pageCount;
        pageNumber += 1
      ) {
        document.setPage(
          pageNumber,
        );

        document.setDrawColor(
          226,
          232,
          240,
        );

        document.line(
          margin,
          pageHeight - 14,
          pageWidth - margin,
          pageHeight - 14,
        );

        document.setFont(
          "helvetica",
          "normal",
        );

        document.setFontSize(8);

        document.setTextColor(
          100,
          116,
          139,
        );

        document.text(
          "SentinelAI Executive SOC Report",
          margin,
          pageHeight - 8,
        );

        document.text(
          `Page ${pageNumber} of ${pageCount}`,
          pageWidth - margin,
          pageHeight - 8,
          {
            align: "right",
          },
        );
      }

      const safeFilename =
        normalizeReportFilename(
          analysis.filename,
        );

      document.save(
        `SentinelAI_${safeFilename}_Executive_Report.pdf`,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "SentinelAI could not generate the executive PDF report.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  if (isLoading) {
    return <LoadingReport />;
  }

  if (!analysis) {
    return <EmptyReports />;
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 text-white sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-blue-500/15 p-3">
              <FileText className="h-8 w-8 text-blue-400" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                SentinelAI Reporting
              </p>

              <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
                Executive SOC Reports
              </h1>

              <p className="mt-2 max-w-3xl text-slate-400">
                Leadership-level security metrics,
                investigation performance, MITRE ATT&CK
                coverage, threat-source analysis, and
                executive PDF reporting.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                void loadReportData()
              }
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-3 text-sm font-medium text-slate-300 transition hover:border-blue-500 hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </button>

            <button
              type="button"
              onClick={() =>
                void generatePdfReport()
              }
              disabled={isGenerating}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  Download Executive PDF
                </>
              )}
            </button>
          </div>
        </header>

        {errorMessage && (
          <section className="mt-6 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

            <p className="text-sm leading-6">
              {errorMessage}
            </p>
          </section>
        )}

        <div className="mt-8 space-y-8">
          <ExecutiveOverview
            analysis={analysis}
            investigations={investigations}
          />

          <ThreatTrendChart
            analysis={analysis}
            investigations={investigations}
          />

          <div className="grid gap-8 xl:grid-cols-2">
            <MitreCoverage
              analysis={analysis}
            />

            <TopThreatActors
              analysis={analysis}
            />
          </div>

          <AnalystPerformance
            investigations={investigations}
          />

          <ExecutiveExport
            onExport={() =>
              void generatePdfReport()
            }
            totalCases={
              investigations.length
            }
            totalDetections={
              analysis.detections.length
            }
            totalThreats={
              analysis.suspicious_ips.length
            }
          />
        </div>
      </div>
    </div>
  );
}
function LoadingReport() {
  return (
    <div className="min-h-screen bg-slate-900 p-8 text-white">
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-400" />

          <h1 className="mt-5 text-xl font-bold">
            Loading executive report data
          </h1>

          <p className="mt-2 text-slate-400">
            SentinelAI is preparing security metrics,
            investigations, and threat intelligence.
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyReports() {
  return (
    <div className="min-h-screen bg-slate-900 p-8 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold">
          Executive SOC Reports
        </h1>

        <section className="mt-10 rounded-xl border border-dashed border-slate-600 bg-slate-800 p-12 text-center">
          <FileText className="mx-auto h-14 w-14 text-blue-400" />

          <h2 className="mt-5 text-2xl font-bold">
            No active analysis
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-slate-400">
            Upload a security log or open an analysis from
            History before viewing executive reports.
          </p>
        </section>
      </div>
    </div>
  );
}

function buildExecutiveSummary(
  analysis: UploadResult,
  highestRiskIp?: string,
) {
  const primaryDetection =
    [...analysis.detections].sort(
      (
        firstDetection,
        secondDetection,
      ) =>
        getSeverityScore(
          secondDetection.severity,
        ) -
        getSeverityScore(
          firstDetection.severity,
        ),
    )[0];

  const sourceText =
    highestRiskIp
      ? `The most notable suspicious source was ${highestRiskIp}.`
      : "No suspicious source IP exceeded the configured threshold.";

  const detectionText =
    primaryDetection
      ? `The primary finding was ${primaryDetection.type}, mapped to MITRE ATT&CK ${primaryDetection.mitre_id} with ${primaryDetection.confidence}% confidence.`
      : "No primary MITRE ATT&CK detection was generated.";

  return `SentinelAI analyzed ${analysis.entries.toLocaleString()} security events from ${analysis.filename}. The analysis identified ${analysis.failed_logins.toLocaleString()} failed login attempts and ${analysis.successful_logins.toLocaleString()} successful login attempts. ${sourceText} ${detectionText} The resulting incident assessment is ${analysis.risk_level.toLowerCase()} risk with a score of ${analysis.risk_score}/100.`;
}

function getRecommendations(
  analysis: UploadResult,
) {
  const detectionRecommendations =
    analysis.detections.flatMap(
      (detection) =>
        detection.recommendations ??
        [],
    );

  const recommendations =
    Array.from(
      new Set(
        detectionRecommendations.filter(
          (recommendation) =>
            recommendation.trim()
              .length > 0,
        ),
      ),
    );

  if (recommendations.length > 0) {
    return recommendations;
  }

  return [
    "Review all suspicious source IP addresses and correlate their activity with the authentication timeline.",
    "Validate whether successful logins were authorized.",
    "Review targeted privileged accounts and reset credentials when compromise is suspected.",
    "Enable multifactor authentication and rate limiting for exposed authentication services.",
    "Preserve related logs and document analyst findings before containment.",
  ];
}

function getSeverityScore(
  severity:
    UploadResult["detections"][number]["severity"],
) {
  const scores: Record<
    UploadResult["detections"][number]["severity"],
    number
  > = {
    Critical: 4,
    High: 3,
    Medium: 2,
    Low: 1,
  };

  return scores[severity];
}

function getRiskColor(
  riskLevel: UploadResult["risk_level"],
): [number, number, number] {
  switch (riskLevel) {
    case "Critical":
      return [220, 38, 38];

    case "High":
      return [234, 88, 12];

    case "Medium":
      return [217, 119, 6];

    case "Low":
    default:
      return [22, 163, 74];
  }
}

function getIpPriority(
  attempts: number,
) {
  if (attempts >= 20) {
    return "Critical";
  }

  if (attempts >= 10) {
    return "High";
  }

  if (attempts >= 4) {
    return "Medium";
  }

  return "Low";
}

function getUniqueAnalysts(
  investigations: Investigation[],
) {
  return Array.from(
    new Set(
      investigations.map(
        (investigation) =>
          investigation.analyst.trim() ||
          "Unassigned",
      ),
    ),
  );
}

function formatReportDate(
  value: string | null,
) {
  if (!value) {
    return "Unavailable";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return date.toLocaleString();
}

function normalizeReportFilename(
  filename: string,
) {
  const cleanedFilename =
    filename
      .trim()
      .replace(
        /(\.(?:log|txt|csv|json))\1$/i,
        "$1",
      );

  const withoutExtension =
    cleanedFilename.replace(
      /\.[^/.]+$/,
      "",
    );

  const safeFilename =
    withoutExtension.replace(
      /[^a-zA-Z0-9-_]/g,
      "_",
    );

  return safeFilename || "Security_Analysis";
}

export default Reports;