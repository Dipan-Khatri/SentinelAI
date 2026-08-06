import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  Database,
  Download,
  FileKey2,
  FileText,
  Fingerprint,
  Gauge,
  Loader2,
  Network,
  PlayCircle,
  RotateCcw,
  Save,
  ShieldAlert,
  Target,
  UserRound,
  XCircle,
} from "lucide-react";

import CopyButton from "../components/CopyButton";
import { useToast } from "../context/ToastContext";
import { addSocActivity } from "../services/activityFeed";

import {
  getInvestigation,
  saveInvestigation,
} from "../services/api";

import type {
  Detection,
  Investigation,
  InvestigationStatus,
  TimelineEvent,
  UploadResult,
} from "../services/api";

import exportInvestigationPdf from "../utils/exportInvestigationPdf";

const ANALYSIS_STORAGE_KEY =
  "sentinelai_latest_analysis";

const SELECTED_DETECTION_STORAGE_KEY =
  "sentinelai_selected_detection_id";

const DEFAULT_ANALYST = "Dipan";

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

type IocEvidenceItem = {
  id: string;
  label: string;
  value: string;

  type:
    | "IP Address"
    | "User Account"
    | "MITRE Technique"
    | "Detection"
    | "Log Source";

  icon: React.ComponentType<{
    className?: string;
  }>;

  valueClass: string;
  copyable: boolean;
};

type QuickAction = {
  label: string;
  description: string;
  status: InvestigationStatus;

  icon: React.ComponentType<{
    className?: string;
  }>;

  className: string;
};

const quickActions: QuickAction[] = [
  {
    label: "Start Investigation",
    description:
      "Move this case into active investigation.",
    status: "In Progress",
    icon: PlayCircle,
    className:
      "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20",
  },

  {
    label: "Mark False Positive",
    description:
      "Close the alert as legitimate or non-malicious activity.",
    status: "False Positive",
    icon: XCircle,
    className:
      "border-slate-500/40 bg-slate-500/10 text-slate-300 hover:bg-slate-500/20",
  },

  {
    label: "Resolve Case",
    description:
      "Mark the investigation as completed.",
    status: "Resolved",
    icon: CheckCircle2,
    className:
      "border-green-500/40 bg-green-500/10 text-green-300 hover:bg-green-500/20",
  },

  {
    label: "Reopen Case",
    description:
      "Return a closed investigation to the open queue.",
    status: "Open",
    icon: RotateCcw,
    className:
      "border-blue-500/40 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20",
  },
];

function Investigations() {
  const [analysis, setAnalysis] =
    useState<UploadResult | null>(null);

  const [
    selectedDetectionIndex,
    setSelectedDetectionIndex,
  ] = useState(0);

  const [
    investigation,
    setInvestigation,
  ] = useState<Investigation | null>(null);

  const [status, setStatus] =
    useState<InvestigationStatus>("Open");

  const [analyst, setAnalyst] =
    useState(DEFAULT_ANALYST);

  const [notes, setNotes] =
    useState("");

  const [
    completedActions,
    setCompletedActions,
  ] = useState<string[]>([]);

  const [
    saveMessage,
    setSaveMessage,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    isLoadingInvestigation,
    setIsLoadingInvestigation,
  ] = useState(false);

  const [
    isSavingInvestigation,
    setIsSavingInvestigation,
  ] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    const savedAnalysis =
      localStorage.getItem(
        ANALYSIS_STORAGE_KEY,
      );

    if (!savedAnalysis) {
      return;
    }

    try {
      const parsedAnalysis =
        JSON.parse(
          savedAnalysis,
        ) as UploadResult;

      const savedDetectionId =
        localStorage.getItem(
          SELECTED_DETECTION_STORAGE_KEY,
        );

      if (savedDetectionId) {
        const detectionId =
          Number(savedDetectionId);

        const matchingDetectionIndex =
          parsedAnalysis.detections.findIndex(
            (detection) =>
              detection.id === detectionId,
          );

        setSelectedDetectionIndex(
          matchingDetectionIndex >= 0
            ? matchingDetectionIndex
            : 0,
        );

        localStorage.removeItem(
          SELECTED_DETECTION_STORAGE_KEY,
        );
      } else {
        setSelectedDetectionIndex(0);
      }

      setAnalysis(parsedAnalysis);
    } catch {
      localStorage.removeItem(
        ANALYSIS_STORAGE_KEY,
      );

      localStorage.removeItem(
        SELECTED_DETECTION_STORAGE_KEY,
      );

      showToast({
        title: "Analysis unavailable",
        message:
          "SentinelAI could not load the saved analysis.",
        type: "error",
      });
    }
  }, [showToast]);

  const selectedDetection =
    useMemo(() => {
      if (
        !analysis ||
        analysis.detections.length === 0
      ) {
        return null;
      }

      return (
        analysis.detections[
          selectedDetectionIndex
        ] ?? analysis.detections[0]
      );
    }, [
      analysis,
      selectedDetectionIndex,
    ]);

  useEffect(() => {
    let isCancelled = false;

    async function loadInvestigation() {
      setInvestigation(null);
      setStatus("Open");
      setAnalyst(DEFAULT_ANALYST);
      setNotes("");
      setCompletedActions([]);
      setSaveMessage("");
      setErrorMessage("");

      if (
        !analysis?.analysis_id ||
        !selectedDetection?.id
      ) {
        return;
      }

      setIsLoadingInvestigation(true);

      try {
        const savedInvestigation =
          await getInvestigation(
            analysis.analysis_id,
            selectedDetection.id,
          );

        if (isCancelled) {
          return;
        }

        if (savedInvestigation) {
          setInvestigation(
            savedInvestigation,
          );

          setStatus(
            savedInvestigation.status,
          );

          setAnalyst(
            savedInvestigation.analyst ||
              DEFAULT_ANALYST,
          );

          setNotes(
            savedInvestigation.notes,
          );

          setCompletedActions(
            savedInvestigation
              .completed_actions ?? [],
          );
        }
      } catch (error) {
        if (isCancelled) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "The investigation could not be loaded.";

        setErrorMessage(message);

        showToast({
          title:
            "Investigation unavailable",
          message,
          type: "error",
        });
      } finally {
        if (!isCancelled) {
          setIsLoadingInvestigation(
            false,
          );
        }
      }
    }

    void loadInvestigation();

    return () => {
      isCancelled = true;
    };
  }, [
    analysis?.analysis_id,
    selectedDetection?.id,
    showToast,
  ]);

  const relatedTimeline =
    useMemo(() => {
      if (
        !analysis ||
        !selectedDetection
      ) {
        return [];
      }

      return analysis.timeline.filter(
        (event) => {
          if (
            selectedDetection.source_ip &&
            event.ip ===
              selectedDetection.source_ip
          ) {
            return true;
          }

          return selectedDetection.affected_users.some(
            (user) =>
              event.user?.includes(user),
          );
        },
      );
    }, [
      analysis,
      selectedDetection,
    ]);

  const iocEvidenceItems =
    useMemo<IocEvidenceItem[]>(() => {
      if (
        !analysis ||
        !selectedDetection
      ) {
        return [];
      }

      const items: IocEvidenceItem[] = [];

      if (selectedDetection.source_ip) {
        items.push({
          id: `ip-${selectedDetection.source_ip}`,
          label: "Source IP",
          value:
            selectedDetection.source_ip,
          type: "IP Address",
          icon: Network,
          valueClass:
            "font-mono text-red-300",
          copyable: true,
        });
      }

      selectedDetection.affected_users.forEach(
        (user, index) => {
          items.push({
            id: `user-${user}-${index}`,
            label: "Targeted Account",
            value: user,
            type: "User Account",
            icon: UserRound,
            valueClass:
              "text-purple-300",
            copyable: true,
          });
        },
      );

      items.push({
        id: `mitre-${selectedDetection.mitre_id}`,
        label: "MITRE ATT&CK",
        value:
          selectedDetection.mitre_id,
        type: "MITRE Technique",
        icon: Target,
        valueClass: "text-blue-300",
        copyable: true,
      });

      items.push({
        id: `detection-${selectedDetection.type}`,
        label: "Detection Type",
        value:
          selectedDetection.type,
        type: "Detection",
        icon: ShieldAlert,
        valueClass:
          "text-orange-300",
        copyable: false,
      });

      items.push({
        id: `file-${analysis.filename}`,
        label: "Log Source",
        value: analysis.filename,
        type: "Log Source",
        icon: FileText,
        valueClass:
          "text-slate-200",
        copyable: true,
      });

      return items;
    }, [
      analysis,
      selectedDetection,
    ]);

  const completedActionPercentage =
    useMemo(() => {
      if (
        !selectedDetection ||
        selectedDetection.recommendations
          .length === 0
      ) {
        return 0;
      }

      return Math.min(
        Math.round(
          (completedActions.length /
            selectedDetection
              .recommendations.length) *
            100,
        ),
        100,
      );
    }, [
      completedActions.length,
      selectedDetection,
    ]);

  function selectDetection(
    index: number,
  ) {
    setSelectedDetectionIndex(index);

    localStorage.removeItem(
      SELECTED_DETECTION_STORAGE_KEY,
    );
  }

  function clearMessages() {
    setSaveMessage("");
    setErrorMessage("");
  }

  function toggleAction(
    action: string,
  ) {
    setCompletedActions(
      (currentActions) => {
        if (
          currentActions.includes(action)
        ) {
          return currentActions.filter(
            (currentAction) =>
              currentAction !== action,
          );
        }

        return [
          ...currentActions,
          action,
        ];
      },
    );

    clearMessages();
  }
  async function persistInvestigation(
    nextStatus: InvestigationStatus,
    successMessage: string,
  ) {
    if (!analysis?.analysis_id) {
      const message =
        "This analysis does not have a database ID. Reopen it from History or upload the log again.";

      setErrorMessage(message);

      showToast({
        title: "Investigation not saved",
        message,
        type: "warning",
      });

      return;
    }

    if (!selectedDetection?.id) {
      const message =
        "This detection does not have a database ID. Reopen the analysis from History or upload the log again.";

      setErrorMessage(message);

      showToast({
        title: "Investigation not saved",
        message,
        type: "warning",
      });

      return;
    }

    const wasExistingInvestigation =
      Boolean(investigation);

    setIsSavingInvestigation(true);
    setSaveMessage("");
    setErrorMessage("");

    try {
      const savedInvestigation =
        await saveInvestigation({
          analysis_id:
            analysis.analysis_id,

          detection_id:
            selectedDetection.id,

          status: nextStatus,

          analyst:
            analyst.trim() ||
            DEFAULT_ANALYST,

          notes,

          completed_actions:
            completedActions,
        });

      setInvestigation(
        savedInvestigation,
      );

      setStatus(
        savedInvestigation.status,
      );

      setAnalyst(
        savedInvestigation.analyst,
      );

      setNotes(
        savedInvestigation.notes,
      );

      setCompletedActions(
        savedInvestigation
          .completed_actions ?? [],
      );

      setSaveMessage(successMessage);

      const activityDetails =
        getInvestigationActivityDetails(
          savedInvestigation.status,
          wasExistingInvestigation,
        );

      addSocActivity({
        title: activityDetails.title,

        description:
          `${selectedDetection.type} was ${activityDetails.description} by ${savedInvestigation.analyst}. ${savedInvestigation.completed_actions.length.toLocaleString()} response action${
            savedInvestigation
              .completed_actions.length === 1
              ? ""
              : "s"
          } completed.`,

        category: "investigation",

        severity:
          activityDetails.severity,

        sourceIp:
          selectedDetection.source_ip ??
          undefined,

        filename:
          analysis.filename,

        mitreId:
          selectedDetection.mitre_id,

        caseId:
          savedInvestigation.id,
      });

      showToast({
        title:
          activityDetails.toastTitle,

        message:
          `Case #${savedInvestigation.id}: ${selectedDetection.type}`,

        type: "success",
        duration: 3500,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "The investigation could not be saved.";

      setErrorMessage(message);

      addSocActivity({
        title:
          "Investigation save failed",

        description:
          `${selectedDetection.type} could not be saved. ${message}`,

        category: "system",
        severity: "High",

        sourceIp:
          selectedDetection.source_ip ??
          undefined,

        filename:
          analysis.filename,

        mitreId:
          selectedDetection.mitre_id,

        caseId:
          investigation?.id,
      });

      showToast({
        title:
          "Investigation save failed",
        message,
        type: "error",
        duration: 6000,
      });
    } finally {
      setIsSavingInvestigation(
        false,
      );
    }
  }

  function handleSaveInvestigation() {
    void persistInvestigation(
      status,
      investigation
        ? "Investigation updated successfully."
        : "Investigation saved successfully.",
    );
  }

  function handleQuickAction(
    nextStatus: InvestigationStatus,
  ) {
    setStatus(nextStatus);

    void persistInvestigation(
      nextStatus,
      getQuickActionSuccessMessage(
        nextStatus,
      ),
    );
  }

  function handleExportPdf() {
    if (
      !analysis ||
      !selectedDetection
    ) {
      showToast({
        title: "Report unavailable",
        message:
          "No investigation data is available to export.",
        type: "warning",
      });

      return;
    }

    try {
      exportInvestigationPdf({
        analysis,
        detection:
          selectedDetection,
        investigation,
        relatedTimeline,
        analyst,
        notes,
        completedActions,
      });

      addSocActivity({
        title:
          "Investigation report exported",

        description:
          `${selectedDetection.type} was exported as a PDF investigation report.`,

        category: "report",
        severity: "Success",

        sourceIp:
          selectedDetection.source_ip ??
          undefined,

        filename:
          analysis.filename,

        mitreId:
          selectedDetection.mitre_id,

        caseId:
          investigation?.id,
      });

      showToast({
        title:
          "PDF report generated",

        message: investigation
          ? `Case #${investigation.id} was exported successfully.`
          : "The unsaved investigation was exported successfully.",

        type: "success",
        duration: 3500,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "The PDF report could not be generated.";

      addSocActivity({
        title:
          "Investigation report export failed",

        description:
          `${selectedDetection.type} could not be exported. ${message}`,

        category: "system",
        severity: "High",

        sourceIp:
          selectedDetection.source_ip ??
          undefined,

        filename:
          analysis.filename,

        mitreId:
          selectedDetection.mitre_id,

        caseId:
          investigation?.id,
      });

      showToast({
        title:
          "PDF export failed",
        message,
        type: "error",
        duration: 5000,
      });
    }
  }

  if (!analysis) {
    return <EmptyInvestigation />;
  }

  if (!selectedDetection) {
    return <NoDetections />;
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 text-white sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Link
                to="/"
                className="transition hover:text-blue-400"
              >
                Dashboard
              </Link>

              <ChevronRight className="h-4 w-4" />

              <span>
                Investigation Workspace
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
              Investigation Workspace
            </h1>

            <p className="mt-2 text-slate-400">
              Review evidence, investigate alerts,
              document findings, and complete response
              actions.
            </p>
          </div>

          <Link
            to="/"
            className="flex items-center gap-2 rounded-lg border border-slate-600 px-5 py-3 font-medium text-slate-200 transition hover:border-blue-500 hover:text-blue-400"
          >
            <ArrowLeft className="h-5 w-5" />
            Dashboard
          </Link>
        </header>

        <section className="mt-8 grid gap-6 xl:grid-cols-[340px_1fr]">
          <aside className="rounded-xl border border-slate-700 bg-slate-800 p-5">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-6 w-6 text-red-400" />

              <div>
                <h2 className="text-xl font-bold">
                  Detection Queue
                </h2>

                <p className="text-sm text-slate-400">
                  {analysis.detections.length} active detection
                  {analysis.detections.length === 1
                    ? ""
                    : "s"}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {analysis.detections.map(
                (detection, index) => {
                  const isActive =
                    index ===
                    selectedDetectionIndex;

                  return (
                    <button
                      key={
                        detection.id ??
                        `${detection.type}-${detection.source_ip}-${index}`
                      }
                      type="button"
                      onClick={() =>
                        selectDetection(index)
                      }
                      className={`w-full rounded-lg border p-4 text-left transition ${
                        isActive
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-slate-700 bg-slate-950/40 hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs text-slate-500">
                            Detection #{index + 1}
                          </p>

                          <h3 className="mt-1 break-words font-semibold text-white">
                            {detection.type}
                          </h3>
                        </div>

                        <span
                          className={`shrink-0 rounded-full border px-2 py-1 text-xs font-semibold ${
                            severityStyles[
                              detection.severity
                            ]
                          }`}
                        >
                          {detection.severity}
                        </span>
                      </div>

                      <p className="mt-3 break-all font-mono text-sm text-red-300">
                        {detection.source_ip ??
                          "Unknown source"}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                        <span>
                          {detection.mitre_id}
                        </span>

                        <span>
                          {detection.confidence}% confidence
                        </span>
                      </div>
                    </button>
                  );
                },
              )}
            </div>
          </aside>

          <main className="min-w-0 space-y-6">
            <section className="rounded-xl border border-slate-700 bg-slate-800 p-6">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div className="min-w-0">
                  <p className="text-sm text-slate-500">
                    {investigation
                      ? `Case #${investigation.id}`
                      : "New Investigation"}
                  </p>

                  <h2 className="mt-2 break-words text-3xl font-bold">
                    {selectedDetection.type}
                  </h2>

                  <p className="mt-3 max-w-3xl leading-7 text-slate-300">
                    {selectedDetection.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <span
                    className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                      severityStyles[
                        selectedDetection.severity
                      ]
                    }`}
                  >
                    {selectedDetection.severity}
                  </span>

                  <span
                    className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                      statusStyles[status]
                    }`}
                  >
                    {status}
                  </span>
                </div>
              </div>

              <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <EvidenceMetric
                  icon={Network}
                  label="Source IP"
                  value={
                    selectedDetection.source_ip ??
                    "Unknown"
                  }
                  valueClass="font-mono text-red-300"
                />

                <EvidenceMetric
                  icon={Target}
                  label="MITRE"
                  value={selectedDetection.mitre_id}
                  valueClass="text-blue-400"
                />

                <EvidenceMetric
                  icon={Gauge}
                  label="Confidence"
                  value={`${selectedDetection.confidence}%`}
                  valueClass="text-green-400"
                />

                <EvidenceMetric
                  icon={Database}
                  label="Events"
                  value={String(
                    selectedDetection.event_count,
                  )}
                />
              </div>
            </section>

            {isLoadingInvestigation && (
              <section className="flex items-center gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-blue-300">
                <Loader2 className="h-5 w-5 animate-spin" />

                <span>
                  Loading saved investigation…
                </span>
              </section>
            )}

            {errorMessage && (
              <section className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

                <p className="text-sm leading-6">
                  {errorMessage}
                </p>
              </section>
            )}

            <section className="rounded-xl border border-slate-700 bg-slate-800 p-6">
              <div className="flex items-center gap-3">
                <Fingerprint className="h-6 w-6 text-cyan-400" />

                <div>
                  <h2 className="text-xl font-bold">
                    Indicators of Compromise
                  </h2>

                  <p className="text-sm text-slate-400">
                    Extracted indicators from this
                    investigation.
                  </p>
                </div>
              </div>

              <div className="mt-6 overflow-x-auto rounded-lg border border-slate-700">
                <table className="w-full min-w-[640px]">
                  <thead className="bg-slate-950">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Type
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Value
                      </th>

                      <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Copy
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {iocEvidenceItems.map(
                      (item) => {
                        const ItemIcon =
                          item.icon;

                        return (
                          <tr
                            key={item.id}
                            className="border-t border-slate-700"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <ItemIcon className="h-4 w-4 shrink-0 text-blue-400" />

                                <span className="text-sm text-slate-200">
                                  {item.type}
                                </span>
                              </div>
                            </td>

                            <td
                              className={`px-5 py-4 break-all text-sm font-semibold ${item.valueClass}`}
                            >
                              {item.value}
                            </td>

                            <td className="px-5 py-4 text-center">
                              {item.copyable ? (
                                <CopyButton
                                  value={item.value}
                                  label=""
                                  copiedLabel=""
                                  className="h-8 px-2"
                                />
                              ) : (
                                <span className="text-xs text-slate-600">
                                  —
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-xl border border-slate-700 bg-slate-800 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">
                    Quick Case Actions
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Update and save the case status with
                    one click.
                  </p>
                </div>

                {isSavingInvestigation && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-300">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving
                  </span>
                )}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {quickActions.map(
                  (action) => {
                    const ActionIcon =
                      action.icon;

                    const isCurrentStatus =
                      status === action.status;

                    const shouldDisable =
                      isLoadingInvestigation ||
                      isSavingInvestigation ||
                      isCurrentStatus;

                    return (
                      <button
                        key={action.status}
                        type="button"
                        disabled={shouldDisable}
                        onClick={() =>
                          handleQuickAction(
                            action.status,
                          )
                        }
                        className={`rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-40 ${action.className}`}
                      >
                        <div className="flex items-center gap-3">
                          <ActionIcon className="h-5 w-5 shrink-0" />

                          <span className="font-semibold">
                            {action.label}
                          </span>
                        </div>

                        <p className="mt-3 text-xs leading-5 opacity-80">
                          {action.description}
                        </p>

                        {isCurrentStatus && (
                          <p className="mt-3 text-xs font-semibold">
                            Current status
                          </p>
                        )}
                      </button>
                    );
                  },
                )}
              </div>
            </section>

            <section className="rounded-xl border border-slate-700 bg-slate-800 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Gauge className="h-6 w-6 text-green-400" />

                  <div>
                    <h2 className="text-xl font-bold">
                      Investigation Progress
                    </h2>

                    <p className="text-sm text-slate-400">
                      Progress is calculated from completed
                      response actions.
                    </p>
                  </div>
                </div>

                <span className="text-2xl font-bold text-green-300">
                  {completedActionPercentage}%
                </span>
              </div>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-950">
                <div
                  className="h-full rounded-full bg-green-500 transition-all duration-500"
                  style={{
                    width: `${completedActionPercentage}%`,
                  }}
                />
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                <span>
                  {completedActions.length.toLocaleString()} of{" "}
                  {selectedDetection.recommendations.length.toLocaleString()}{" "}
                  actions completed
                </span>

                <span>
                  Status: {status}
                </span>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
                <div className="flex items-center gap-3">
                  <Clock3 className="h-6 w-6 text-blue-400" />

                  <div>
                    <h2 className="text-xl font-bold">
                      Investigation Status
                    </h2>

                    <p className="text-sm text-slate-400">
                      Manually set the current case state.
                    </p>
                  </div>
                </div>

                <select
                  value={status}
                  disabled={
                    isLoadingInvestigation ||
                    isSavingInvestigation
                  }
                  onChange={(event) => {
                    setStatus(
                      event.target
                        .value as InvestigationStatus,
                    );

                    clearMessages();
                  }}
                  className="mt-5 w-full rounded-lg border border-slate-600 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
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
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
                <div className="flex items-center gap-3">
                  <UserRound className="h-6 w-6 text-purple-400" />

                  <div>
                    <h2 className="text-xl font-bold">
                      Assigned Analyst
                    </h2>

                    <p className="text-sm text-slate-400">
                      Identify the analyst responsible for
                      this case.
                    </p>
                  </div>
                </div>

                <input
                  type="text"
                  value={analyst}
                  disabled={
                    isLoadingInvestigation ||
                    isSavingInvestigation
                  }
                  onChange={(event) => {
                    setAnalyst(
                      event.target.value,
                    );

                    clearMessages();
                  }}
                  placeholder="Analyst name"
                  maxLength={100}
                  className="mt-5 w-full rounded-lg border border-slate-600 bg-slate-950 px-4 py-3 text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </section>

            <section className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-7 w-7 text-amber-400" />

                <div>
                  <h2 className="text-xl font-bold text-amber-300">
                    Recommended Response Actions
                  </h2>

                  <p className="text-sm text-slate-400">
                    Check each response action after it has
                    been completed.
                  </p>
                </div>
              </div>

              {selectedDetection.recommendations.length >
              0 ? (
                <div className="mt-6 space-y-3">
                  {selectedDetection.recommendations.map(
                    (recommendation) => {
                      const isChecked =
                        completedActions.includes(
                          recommendation,
                        );

                      return (
                        <label
                          key={recommendation}
                          className={`flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition ${
                            isChecked
                              ? "border-green-500/30 bg-green-500/10"
                              : "border-slate-700 bg-slate-950/40 hover:border-slate-500"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={
                              isLoadingInvestigation ||
                              isSavingInvestigation
                            }
                            onChange={() =>
                              toggleAction(
                                recommendation,
                              )
                            }
                            className="mt-1 h-4 w-4 shrink-0 accent-green-500"
                          />

                          <div className="min-w-0">
                            <p
                              className={
                                isChecked
                                  ? "text-green-300 line-through"
                                  : "text-slate-200"
                              }
                            >
                              {recommendation}
                            </p>

                            {isChecked && (
                              <p className="mt-1 text-xs font-semibold text-green-400">
                                Completed
                              </p>
                            )}
                          </div>
                        </label>
                      );
                    },
                  )}
                </div>
              ) : (
                <p className="mt-6 rounded-lg border border-slate-700 bg-slate-950/40 p-4 text-sm text-slate-400">
                  No recommended actions are available for
                  this detection.
                </p>
              )}
            </section>

            <section className="rounded-xl border border-slate-700 bg-slate-800 p-6">
              <div className="flex items-center gap-3">
                <FileKey2 className="h-6 w-6 text-blue-400" />

                <div>
                  <h2 className="text-xl font-bold">
                    Analyst Notes
                  </h2>

                  <p className="text-sm text-slate-400">
                    Record findings, evidence, and response
                    decisions.
                  </p>
                </div>
              </div>

              <textarea
                rows={8}
                maxLength={10000}
                value={notes}
                disabled={
                  isLoadingInvestigation ||
                  isSavingInvestigation
                }
                onChange={(event) => {
                  setNotes(
                    event.target.value,
                  );

                  clearMessages();
                }}
                className="mt-5 w-full resize-y rounded-lg border border-slate-600 bg-slate-950 p-4 text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="Write investigation notes..."
              />

              <div className="mt-2 flex flex-wrap justify-between gap-3 text-xs text-slate-500">
                <span>
                  Notes are stored in SQLite when saved.
                </span>

                <span>
                  {notes.length.toLocaleString()} / 10,000
                </span>
              </div>
            </section>

            <section className="rounded-xl border border-slate-700 bg-slate-800 p-6">
              <div className="flex items-center gap-3">
                <Clock3 className="h-6 w-6 text-blue-400" />

                <div>
                  <h2 className="text-xl font-bold">
                    Related Timeline
                  </h2>

                  <p className="text-sm text-slate-400">
                    Authentication events related to this
                    investigation.
                  </p>
                </div>
              </div>

              {relatedTimeline.length > 0 ? (
                <div className="relative mt-6">
                  <div className="absolute bottom-0 left-5 top-0 w-px bg-slate-700" />

                  <div className="space-y-5">
                    {relatedTimeline.map(
                      (event, index) => (
                        <EvidenceTimelineItem
                          key={
                            event.id ??
                            `${event.line_number}-${index}`
                          }
                          event={event}
                        />
                      ),
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-lg border border-dashed border-slate-600 bg-slate-950/40 p-8 text-center">
                  <Clock3 className="mx-auto h-9 w-9 text-slate-600" />

                  <p className="mt-3 font-medium text-slate-300">
                    No related timeline events
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    SentinelAI could not match timeline
                    events to this source or account.
                  </p>
                </div>
              )}
            </section>

            <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-700 bg-slate-800 p-6">
              <div>
                {saveMessage ? (
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle2 className="h-5 w-5" />

                    <span>
                      {saveMessage}
                    </span>
                  </div>
                ) : investigation ? (
                  <div>
                    <p className="text-sm font-medium text-slate-300">
                      Case #{investigation.id} is saved in
                      SQLite.
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Last updated:{" "}
                      {formatInvestigationDate(
                        investigation.updated_at,
                      )}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">
                    Save the investigation before leaving.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={
                    isLoadingInvestigation ||
                    isSavingInvestigation
                  }
                  className="flex items-center gap-2 rounded-lg border border-indigo-500 bg-indigo-500/10 px-6 py-3 font-medium text-indigo-300 transition hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download className="h-5 w-5" />
                  Generate PDF Report
                </button>

                <button
                  type="button"
                  disabled={
                    isLoadingInvestigation ||
                    isSavingInvestigation
                  }
                  onClick={
                    handleSaveInvestigation
                  }
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSavingInvestigation ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Save className="h-5 w-5" />
                  )}

                  {investigation
                    ? "Update Investigation"
                    : "Save Investigation"}
                </button>
              </div>
            </section>
          </main>
        </section>
      </div>
    </div>
  );
}
type EvidenceMetricProps = {
  icon: React.ComponentType<{
    className?: string;
  }>;
  label: string;
  value: string;
  valueClass?: string;
};

function EvidenceMetric({
  icon: Icon,
  label,
  value,
  valueClass = "text-white",
}: EvidenceMetricProps) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/40 p-4">
      <div className="flex items-center gap-2 text-slate-400">
        <Icon className="h-4 w-4" />
        <span className="text-sm">{label}</span>
      </div>

      <p
        className={`mt-3 break-all text-lg font-semibold ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}

function EvidenceTimelineItem({
  event,
}: {
  event: TimelineEvent;
}) {
  return (
    <article className="relative flex gap-5">
      <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10">
        <CircleDot className="h-5 w-5 text-blue-400" />
      </div>

      <div className="flex-1 rounded-lg border border-slate-700 bg-slate-950/40 p-5">
        <div className="flex flex-wrap justify-between gap-2">
          <div>
            <p className="text-xs text-slate-500">
              {event.timestamp}
            </p>

            <h3 className="mt-1 font-semibold">
              {event.title}
            </h3>
          </div>

          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs">
            {event.status}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-5 text-sm">
          {event.ip && (
            <span>
              <span className="text-slate-500">
                IP:
              </span>{" "}
              <span className="font-mono text-red-300">
                {event.ip}
              </span>
            </span>
          )}

          {event.user && (
            <span>
              <span className="text-slate-500">
                User:
              </span>{" "}
              {event.user}
            </span>
          )}

          {event.method && (
            <span>
              <span className="text-slate-500">
                Method:
              </span>{" "}
              {event.method}
            </span>
          )}
        </div>

        {event.raw && (
          <details className="mt-4">
            <summary className="cursor-pointer text-blue-400">
              View Raw Log
            </summary>

            <pre className="mt-3 overflow-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-400">
              {event.raw}
            </pre>
          </details>
        )}
      </div>
    </article>
  );
}

function EmptyInvestigation() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
      <div className="text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-blue-400" />

        <h1 className="mt-5 text-3xl font-bold">
          No Investigation Loaded
        </h1>

        <p className="mt-3 text-slate-400">
          Upload logs before opening the
          Investigation Workspace.
        </p>

        <Link
          to="/upload"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3"
        >
          Upload Logs

          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function NoDetections() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
      <div className="text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-400" />

        <h1 className="mt-5 text-3xl font-bold">
          No Threats Found
        </h1>

        <p className="mt-3 text-slate-400">
          SentinelAI did not detect any
          incidents requiring investigation.
        </p>

        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-3"
        >
          Dashboard

          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function formatInvestigationDate(
  value: string | null,
) {
  if (!value) return "Recently";

  return new Date(value).toLocaleString();
}

function getQuickActionSuccessMessage(
  status: InvestigationStatus,
) {
  switch (status) {
    case "Resolved":
      return "Investigation resolved.";

    case "False Positive":
      return "Marked as false positive.";

    case "In Progress":
      return "Investigation started.";

    default:
      return "Investigation reopened.";
  }
}

function getInvestigationActivityDetails(
  status: InvestigationStatus,
  existing: boolean,
) {
  switch (status) {
    case "Resolved":
      return {
        title:
          "Investigation resolved",
        description:
          "resolved successfully",
        severity:
          "Success" as const,
        toastTitle:
          "Investigation resolved",
      };

    case "False Positive":
      return {
        title:
          "Marked as false positive",
        description:
          "closed as false positive",
        severity:
          "Low" as const,
        toastTitle:
          "False positive recorded",
      };

    case "In Progress":
      return {
        title: existing
          ? "Investigation updated"
          : "Investigation started",

        description:
          "placed into investigation",

        severity:
          "Medium" as const,

        toastTitle:
          "Investigation updated",
      };

    default:
      return {
        title: existing
          ? "Investigation reopened"
          : "Investigation created",

        description:
          "reopened",

        severity:
          "Info" as const,

        toastTitle:
          "Investigation reopened",
      };
  }
}

export default Investigations;
