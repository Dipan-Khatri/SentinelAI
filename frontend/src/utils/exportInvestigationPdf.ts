import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import type {
  Detection,
  Investigation,
  TimelineEvent,
  UploadResult,
} from "../services/api";

type ExportInvestigationPdfOptions = {
  analysis: UploadResult;
  detection: Detection;
  investigation: Investigation | null;
  relatedTimeline: TimelineEvent[];
  analyst: string;
  notes: string;
  completedActions: string[];
};

type PdfColor = [
  number,
  number,
  number,
];

const COLORS = {
  navy: [15, 23, 42] as PdfColor,
  blue: [37, 99, 235] as PdfColor,
  blueDark: [30, 64, 175] as PdfColor,
  blueLight: [219, 234, 254] as PdfColor,
  slate: [71, 85, 105] as PdfColor,
  slateLight: [226, 232, 240] as PdfColor,
  white: [255, 255, 255] as PdfColor,
  red: [220, 38, 38] as PdfColor,
  redLight: [254, 226, 226] as PdfColor,
  orange: [234, 88, 12] as PdfColor,
  orangeLight: [255, 237, 213] as PdfColor,
  amber: [217, 119, 6] as PdfColor,
  amberLight: [254, 243, 199] as PdfColor,
  green: [22, 163, 74] as PdfColor,
  greenLight: [220, 252, 231] as PdfColor,
  purple: [126, 34, 206] as PdfColor,
  purpleLight: [243, 232, 255] as PdfColor,
};

function exportInvestigationPdf({
  analysis,
  detection,
  investigation,
  relatedTimeline,
  analyst,
  notes,
  completedActions,
}: ExportInvestigationPdfOptions) {
  const document = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth =
    document.internal.pageSize.getWidth();

  const pageHeight =
    document.internal.pageSize.getHeight();

  const margin = 16;
  const contentWidth =
    pageWidth - margin * 2;

  const reportStatus =
    investigation?.status ?? "Open";

  const reportAnalyst =
    analyst.trim() ||
    investigation?.analyst ||
    "Unassigned";

  const reportNotes =
    notes.trim() ||
    investigation?.notes ||
    "No analyst notes were provided.";

  const recommendations =
    detection.recommendations.length > 0
      ? detection.recommendations
      : [
          "Review related authentication events.",
          "Validate the source IP and affected accounts.",
          "Determine whether the activity was authorized.",
        ];

  const completedActionCount =
    recommendations.filter(
      (recommendation) =>
        completedActions.includes(
          recommendation,
        ),
    ).length;

  const progressPercentage =
    recommendations.length > 0
      ? Math.round(
          (completedActionCount /
            recommendations.length) *
            100,
        )
      : 0;

  let currentY = 18;

  document.setProperties({
    title: `SentinelAI Investigation - ${detection.type}`,
    subject:
      "Security Operations Center Investigation Report",
    author:
      reportAnalyst ||
      "SentinelAI Analyst",
    creator: "SentinelAI",
    keywords:
      "SOC, cybersecurity, incident response, investigation, MITRE ATT&CK",
  });

  addReportHeader({
    document,
    pageWidth,
    startY: currentY,
    caseId: investigation?.id,
  });

  currentY += 31;

  document.setFont(
    "helvetica",
    "bold",
  );

  document.setFontSize(18);

  document.setTextColor(
    ...COLORS.navy,
  );

  document.text(
    "Security Investigation Report",
    margin,
    currentY,
  );

  currentY += 7;

  document.setFont(
    "helvetica",
    "normal",
  );

  document.setFontSize(9);

  document.setTextColor(
    ...COLORS.slate,
  );

  document.text(
    `Generated ${new Date().toLocaleString()}`,
    margin,
    currentY,
  );

  currentY += 11;

  addStatusBanner({
    document,
    x: margin,
    y: currentY,
    width: contentWidth,
    severity: detection.severity,
    status: reportStatus,
    riskScore: analysis.risk_score,
  });

  currentY += 22;

  currentY = ensurePageSpace(
    document,
    currentY,
    38,
    pageHeight,
    margin,
  );

  addSectionHeading(
    document,
    "Executive Summary",
    margin,
    currentY,
  );

  currentY += 8;

  const executiveSummary =
    buildExecutiveSummary({
      analysis,
      detection,
      investigation,
      analyst: reportAnalyst,
      progressPercentage,
    });

  currentY = addWrappedText({
    document,
    text: executiveSummary,
    x: margin,
    startY: currentY,
    maxWidth: contentWidth,
    pageHeight,
    margin,
    fontSize: 9.5,
    lineHeight: 5.2,
  });

  currentY += 5;

  currentY = ensurePageSpace(
    document,
    currentY,
    46,
    pageHeight,
    margin,
  );

  addSectionHeading(
    document,
    "Case Overview",
    margin,
    currentY,
  );

  currentY += 8;

  autoTable(document, {
    startY: currentY,
    theme: "grid",

    head: [
      [
        "Case Information",
        "Value",
      ],
    ],

    body: [
      [
        "Investigation ID",
        investigation
          ? `INC-${String(
              investigation.id,
            ).padStart(4, "0")}`
          : "New / Unsaved",
      ],

      [
        "Analysis ID",
        analysis.analysis_id
          ? `#${analysis.analysis_id}`
          : "Unavailable",
      ],

      [
        "Detection ID",
        detection.id
          ? `#${detection.id}`
          : "Unavailable",
      ],

      [
        "Source File",
        analysis.filename,
      ],

      [
        "Assigned Analyst",
        reportAnalyst,
      ],

      [
        "Case Status",
        reportStatus,
      ],

      [
        "Risk Level",
        analysis.risk_level,
      ],

      [
        "Risk Score",
        `${analysis.risk_score}/100`,
      ],

      [
        "Investigation Progress",
        `${progressPercentage}%`,
      ],

      [
        "Completed Actions",
        `${completedActionCount} of ${recommendations.length}`,
      ],
    ],

    styles: {
      fontSize: 9,
      cellPadding: 3,
      overflow: "linebreak",
      lineColor:
        COLORS.slateLight,
      lineWidth: 0.2,
    },

    headStyles: {
      fillColor:
        COLORS.blueDark,
      textColor:
        COLORS.white,
      fontStyle: "bold",
    },

    alternateRowStyles: {
      fillColor: [
        248,
        250,
        252,
      ],
    },

    columnStyles: {
      0: {
        cellWidth: 55,
        fontStyle: "bold",
        textColor: [
          51,
          65,
          85,
        ],
      },

      1: {
        cellWidth:
          contentWidth - 55,
      },
    },

    margin: {
      left: margin,
      right: margin,
    },
  });

  currentY =
    getLastTableY(document) + 10;

  currentY = ensurePageSpace(
    document,
    currentY,
    50,
    pageHeight,
    margin,
  );

  addSectionHeading(
    document,
    "Detection Summary",
    margin,
    currentY,
  );

  currentY += 8;

  autoTable(document, {
    startY: currentY,
    theme: "grid",

    body: [
      [
        "Detection Type",
        detection.type,
      ],

      [
        "Severity",
        detection.severity,
      ],

      [
        "MITRE ATT&CK",
        detection.mitre_id,
      ],

      [
        "Confidence",
        `${detection.confidence}%`,
      ],

      [
        "Source IP",
        detection.source_ip ??
          "Unavailable",
      ],

      [
        "Event Count",
        detection.event_count.toLocaleString(),
      ],

      [
        "Affected Accounts",
        detection.affected_users.length > 0
          ? detection.affected_users.join(
              ", ",
            )
          : "None identified",
      ],
    ],

    styles: {
      fontSize: 9,
      cellPadding: 3,
      overflow: "linebreak",
      lineColor:
        COLORS.slateLight,
      lineWidth: 0.2,
    },

    alternateRowStyles: {
      fillColor: [
        248,
        250,
        252,
      ],
    },

    columnStyles: {
      0: {
        cellWidth: 55,
        fontStyle: "bold",
        textColor: [
          51,
          65,
          85,
        ],
      },

      1: {
        cellWidth:
          contentWidth - 55,
      },
    },

    margin: {
      left: margin,
      right: margin,
    },
  });

  currentY =
    getLastTableY(document) + 10;
  currentY = ensurePageSpace(
    document,
    currentY,
    52,
    pageHeight,
    margin,
  );

  addSectionHeading(
    document,
    "Indicators of Compromise",
    margin,
    currentY,
  );

  currentY += 8;

  const iocRows: string[][] = [];

  if (detection.source_ip) {
    iocRows.push([
      "IP Address",
      detection.source_ip,
      "Primary suspicious source",
    ]);
  }

  detection.affected_users.forEach(
    (user) => {
      iocRows.push([
        "User Account",
        user,
        "Affected or targeted account",
      ]);
    },
  );

  iocRows.push([
    "MITRE Technique",
    detection.mitre_id,
    "Mapped attack behavior",
  ]);

  iocRows.push([
    "Detection Type",
    detection.type,
    "SentinelAI detection rule",
  ]);

  iocRows.push([
    "Log Source",
    analysis.filename,
    "Analyzed evidence file",
  ]);

  autoTable(document, {
    startY: currentY,
    theme: "grid",

    head: [
      [
        "Indicator Type",
        "Value",
        "Context",
      ],
    ],

    body: iocRows,

    styles: {
      fontSize: 8.5,
      cellPadding: 3,
      overflow: "linebreak",
      lineColor:
        COLORS.slateLight,
      lineWidth: 0.2,
    },

    headStyles: {
      fillColor:
        COLORS.blueDark,
      textColor:
        COLORS.white,
      fontStyle: "bold",
    },

    alternateRowStyles: {
      fillColor: [
        248,
        250,
        252,
      ],
    },

    columnStyles: {
      0: {
        cellWidth: 38,
        fontStyle: "bold",
        textColor: [
          51,
          65,
          85,
        ],
      },

      1: {
        cellWidth: 72,
      },

      2: {
        cellWidth:
          contentWidth - 110,
      },
    },

    margin: {
      left: margin,
      right: margin,
    },
  });

  currentY =
    getLastTableY(document) + 10;

  currentY = addParagraphSection({
    document,
    title: "Detection Description",
    text: detection.description,
    startY: currentY,
    pageHeight,
    margin,
    contentWidth,
  });

  currentY = addParagraphSection({
    document,
    title: "Analyst Findings",
    text: reportNotes,
    startY: currentY,
    pageHeight,
    margin,
    contentWidth,
  });

  currentY = ensurePageSpace(
    document,
    currentY,
    42,
    pageHeight,
    margin,
  );

  addSectionHeading(
    document,
    "Investigation Progress",
    margin,
    currentY,
  );

  currentY += 8;

  drawProgressBar({
    document,
    x: margin,
    y: currentY,
    width: contentWidth,
    percentage:
      progressPercentage,
  });

  currentY += 15;

  document.setFont(
    "helvetica",
    "normal",
  );

  document.setFontSize(9);

  document.setTextColor(
    ...COLORS.slate,
  );

  document.text(
    `${completedActionCount} of ${recommendations.length} recommended actions completed`,
    margin,
    currentY,
  );

  currentY += 10;

  currentY = ensurePageSpace(
    document,
    currentY,
    50,
    pageHeight,
    margin,
  );

  addSectionHeading(
    document,
    "Response Actions",
    margin,
    currentY,
  );

  currentY += 8;

  autoTable(document, {
    startY: currentY,
    theme: "grid",

    head: [
      [
        "Status",
        "Recommended Action",
      ],
    ],

    body: recommendations.map(
      (recommendation) => [
        completedActions.includes(
          recommendation,
        )
          ? "Completed"
          : "Pending",

        recommendation,
      ],
    ),

    styles: {
      fontSize: 9,
      cellPadding: 3,
      overflow: "linebreak",
      lineColor:
        COLORS.slateLight,
      lineWidth: 0.2,
    },

    headStyles: {
      fillColor:
        COLORS.blueDark,
      textColor:
        COLORS.white,
      fontStyle: "bold",
    },

    alternateRowStyles: {
      fillColor: [
        248,
        250,
        252,
      ],
    },

    didParseCell: (hookData) => {
      if (
        hookData.section === "body" &&
        hookData.column.index === 0
      ) {
        const statusText =
          String(
            hookData.cell.raw,
          );

        if (
          statusText === "Completed"
        ) {
          hookData.cell.styles.textColor =
            COLORS.green;

          hookData.cell.styles.fillColor =
            COLORS.greenLight;
        } else {
          hookData.cell.styles.textColor =
            COLORS.amber;

          hookData.cell.styles.fillColor =
            COLORS.amberLight;
        }

        hookData.cell.styles.fontStyle =
          "bold";
      }
    },

    columnStyles: {
      0: {
        cellWidth: 34,
      },

      1: {
        cellWidth:
          contentWidth - 34,
      },
    },

    margin: {
      left: margin,
      right: margin,
    },
  });

  currentY =
    getLastTableY(document) + 10;

  currentY = ensurePageSpace(
    document,
    currentY,
    56,
    pageHeight,
    margin,
  );

  addSectionHeading(
    document,
    "Related Evidence Timeline",
    margin,
    currentY,
  );

  currentY += 8;

  if (relatedTimeline.length > 0) {
    autoTable(document, {
      startY: currentY,
      theme: "grid",

      head: [
        [
          "Timestamp",
          "Event",
          "Status",
          "IP",
          "User",
          "Method",
        ],
      ],

      body: relatedTimeline.map(
  (event) => [
    event.timestamp ?? "Unavailable",

    event.title ?? "-",

    event.status ?? "-",

    event.ip ?? "-",

    event.user ?? "-",

    event.method ?? "-",
  ],
),

      styles: {
        fontSize: 7.5,
        cellPadding: 2.3,
        overflow: "linebreak",
        lineColor:
          COLORS.slateLight,
        lineWidth: 0.2,
      },

      headStyles: {
        fillColor:
          COLORS.blueDark,
        textColor:
          COLORS.white,
        fontStyle: "bold",
      },

      alternateRowStyles: {
        fillColor: [
          248,
          250,
          252,
        ],
      },

      columnStyles: {
        0: {
          cellWidth: 30,
        },

        1: {
          cellWidth: 49,
        },

        2: {
          cellWidth: 21,
        },

        3: {
          cellWidth: 28,
        },

        4: {
          cellWidth: 24,
        },

        5: {
          cellWidth:
            contentWidth - 152,
        },
      },

      margin: {
        left: margin,
        right: margin,
      },
    });

    currentY =
      getLastTableY(document) + 10;
  } else {
    document.setFont(
      "helvetica",
      "normal",
    );

    document.setFontSize(9);

    document.setTextColor(
      ...COLORS.slate,
    );

    document.text(
      "No directly related timeline events were found.",
      margin,
      currentY,
    );

    currentY += 10;
  }

  currentY = ensurePageSpace(
    document,
    currentY,
    44,
    pageHeight,
    margin,
  );

  addSectionHeading(
    document,
    "Investigation Conclusion",
    margin,
    currentY,
  );

  currentY += 8;

  const conclusion =
    buildConclusion({
      detection,
      status: reportStatus,
      progressPercentage,
      completedActionCount,
      recommendationCount:
        recommendations.length,
    });

  currentY = addWrappedText({
    document,
    text: conclusion,
    x: margin,
    startY: currentY,
    maxWidth: contentWidth,
    pageHeight,
    margin,
    fontSize: 9.5,
    lineHeight: 5.2,
  });

  currentY += 5;

  const pageCount =
    document.getNumberOfPages();

  for (
    let pageNumber = 1;
    pageNumber <= pageCount;
    pageNumber += 1
  ) {
    document.setPage(pageNumber);

    addPageFooter({
      document,
      pageWidth,
      pageHeight,
      margin,
      pageNumber,
      pageCount,
      caseId: investigation?.id,
    });
  }

  const safeCaseId =
    investigation?.id
      ? `INC-${String(
          investigation.id,
        ).padStart(4, "0")}`
      : "UNSAVED";

  const safeIp =
    detection.source_ip
      ?.replace(
        /[^a-zA-Z0-9.-]/g,
        "_",
      ) ?? "unknown-source";

  document.save(
    `SentinelAI_${safeCaseId}_${safeIp}.pdf`,
  );
}

type AddReportHeaderOptions = {
  document: jsPDF;
  pageWidth: number;
  startY: number;
  caseId?: number;
};

function addReportHeader({
  document,
  pageWidth,
  startY,
  caseId,
}: AddReportHeaderOptions) {
  document.setFillColor(
    ...COLORS.navy,
  );

  document.roundedRect(
    12,
    startY - 8,
    pageWidth - 24,
    24,
    3,
    3,
    "F",
  );

  document.setFont(
    "helvetica",
    "bold",
  );

  document.setFontSize(18);

  document.setTextColor(
    ...COLORS.white,
  );

  document.text(
    "SentinelAI",
    18,
    startY + 2,
  );

  document.setFontSize(9);

  document.setTextColor(
    147,
    197,
    253,
  );

  document.text(
    "SECURITY OPERATIONS CENTER",
    18,
    startY + 8,
  );

  document.setFont(
    "helvetica",
    "bold",
  );

  document.setFontSize(10);

  document.setTextColor(
    ...COLORS.white,
  );

  document.text(
    caseId
      ? `INC-${String(
          caseId,
        ).padStart(4, "0")}`
      : "UNSAVED CASE",
    pageWidth - 18,
    startY + 4,
    {
      align: "right",
    },
  );
}
type AddStatusBannerOptions = {
  document: jsPDF;
  x: number;
  y: number;
  width: number;
  severity: Detection["severity"];
  status: string;
  riskScore: number;
};

function addStatusBanner({
  document,
  x,
  y,
  width,
  severity,
  status,
  riskScore,
}: AddStatusBannerOptions) {
  document.setFillColor(...COLORS.blueLight);

  document.roundedRect(
    x,
    y,
    width,
    14,
    2,
    2,
    "F",
  );

  document.setFont(
    "helvetica",
    "bold",
  );

  document.setFontSize(10);

  document.setTextColor(...COLORS.navy);

  document.text(
    `Severity: ${severity}`,
    x + 4,
    y + 6,
  );

  document.text(
    `Status: ${status}`,
    x + 60,
    y + 6,
  );

  document.text(
    `Risk Score: ${riskScore}/100`,
    x + 118,
    y + 6,
  );
}

function addSectionHeading(
  document: jsPDF,
  title: string,
  x: number,
  y: number,
) {
  document.setFont(
    "helvetica",
    "bold",
  );

  document.setFontSize(12);

  document.setTextColor(
    ...COLORS.navy,
  );

  document.text(title, x, y);
}

type AddWrappedTextOptions = {
  document: jsPDF;
  text: string;
  x: number;
  startY: number;
  maxWidth: number;
  pageHeight: number;
  margin: number;
  fontSize: number;
  lineHeight: number;
};

function addWrappedText({
  document,
  text,
  x,
  startY,
  maxWidth,
  pageHeight,
  margin,
  fontSize,
  lineHeight,
}: AddWrappedTextOptions) {
  document.setFont(
    "helvetica",
    "normal",
  );

  document.setFontSize(fontSize);

  document.setTextColor(
    ...COLORS.slate,
  );

  const lines =
    document.splitTextToSize(
      text,
      maxWidth,
    ) as string[];

  let y = startY;

  lines.forEach((line) => {
    if (
      y >
      pageHeight - 20
    ) {
      document.addPage();
      y = margin;
    }

    document.text(
      line,
      x,
      y,
    );

    y += lineHeight;
  });

  return y;
}

type AddParagraphSectionOptions = {
  document: jsPDF;
  title: string;
  text: string;
  startY: number;
  pageHeight: number;
  margin: number;
  contentWidth: number;
};

function addParagraphSection({
  document,
  title,
  text,
  startY,
  pageHeight,
  margin,
  contentWidth,
}: AddParagraphSectionOptions) {
  let currentY =
    ensurePageSpace(
      document,
      startY,
      40,
      pageHeight,
      margin,
    );

  addSectionHeading(
    document,
    title,
    margin,
    currentY,
  );

  currentY += 8;

  return (
    addWrappedText({
      document,
      text,
      x: margin,
      startY: currentY,
      maxWidth:
        contentWidth,
      pageHeight,
      margin,
      fontSize: 9,
      lineHeight: 5,
    }) + 6
  );
}

type DrawProgressBarOptions = {
  document: jsPDF;
  x: number;
  y: number;
  width: number;
  percentage: number;
};

function drawProgressBar({
  document,
  x,
  y,
  width,
  percentage,
}: DrawProgressBarOptions) {
  document.setFillColor(
    230,
    230,
    230,
  );

  document.roundedRect(
    x,
    y,
    width,
    6,
    2,
    2,
    "F",
  );

  document.setFillColor(
    ...COLORS.green,
  );

  document.roundedRect(
    x,
    y,
    (width * percentage) /
      100,
    6,
    2,
    2,
    "F",
  );
}

function ensurePageSpace(
  document: jsPDF,
  currentY: number,
  requiredHeight: number,
  pageHeight: number,
  margin: number,
) {
  if (
    currentY +
      requiredHeight >
    pageHeight - 18
  ) {
    document.addPage();
    return margin;
  }

  return currentY;
}

function getLastTableY(
  document: jsPDF,
) {
  return (
    (
      document as jsPDF & {
        lastAutoTable?: {
          finalY: number;
        };
      }
    ).lastAutoTable?.finalY ??
    20
  );
}

function addPageFooter({
  document,
  pageWidth,
  pageHeight,
  margin,
  pageNumber,
  pageCount,
  caseId,
}: {
  document: jsPDF;
  pageWidth: number;
  pageHeight: number;
  margin: number;
  pageNumber: number;
  pageCount: number;
  caseId?: number;
}) {
  document.setDrawColor(
    ...COLORS.slateLight,
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
    ...COLORS.slate,
  );

  document.text(
    `SentinelAI SOC Report ${
      caseId
        ? `| INC-${String(
            caseId,
          ).padStart(4, "0")}`
        : ""
    }`,
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

function buildExecutiveSummary({
  analysis,
  detection,
  investigation,
  analyst,
  progressPercentage,
}: {
  analysis: UploadResult;
  detection: Detection;
  investigation: Investigation | null;
  analyst: string;
  progressPercentage: number;
}) {
  return `SentinelAI analyzed ${analysis.entries.toLocaleString()} security events and identified "${detection.type}" as a ${detection.severity} severity incident with a confidence score of ${detection.confidence}%. The investigation is currently marked as ${investigation?.status ?? "Open"} and assigned to ${analyst}. The overall environment risk score is ${analysis.risk_score}/100 with investigation completion currently at ${progressPercentage}%.`;
}

function buildConclusion({
  detection,
  status,
  progressPercentage,
  completedActionCount,
  recommendationCount,
}: {
  detection: Detection;
  status: string;
  progressPercentage: number;
  completedActionCount: number;
  recommendationCount: number;
}) {
  return `The investigation into "${detection.type}" is currently ${status}. ${completedActionCount} of ${recommendationCount} recommended response actions have been completed, resulting in an overall investigation progress of ${progressPercentage}%. SentinelAI recommends continuing monitoring of the affected assets until all remediation actions are completed and the incident is fully validated as contained.`;
}

export default exportInvestigationPdf;
