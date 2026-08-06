import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  ClipboardList,
  FileText,
  Loader2,
  Pause,
  Play,
  Radar,
  RefreshCcw,
  ShieldAlert,
  Trash2,
  Upload,
  Wifi,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  clearSocActivities,
  createInitialSystemActivity,
  getSocActivities,
  removeSocActivity,
  subscribeToSocActivities,
  type ActivityCategory,
  type ActivitySeverity,
  type SocActivity,
} from "../../services/activityFeed";

import type {
  UploadResult,
} from "../../services/api";

type LiveEventFeedProps = {
  analysis?: UploadResult | null;
};

type ActivityStyle = {
  icon: typeof Activity;
  iconClass: string;
  iconBackgroundClass: string;
  badgeClass: string;
  borderClass: string;
};

const MAX_VISIBLE_ACTIVITIES = 30;

function LiveEventFeed({
  analysis,
}: LiveEventFeedProps) {
  const [activities, setActivities] =
    useState<SocActivity[]>([]);

  const [isPaused, setIsPaused] =
    useState(false);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [categoryFilter, setCategoryFilter] =
    useState<ActivityCategory | "all">(
      "all",
    );

  const loadActivities =
    useCallback(() => {
      const savedActivities =
        getSocActivities();

      setActivities(savedActivities);
    }, []);

  useEffect(() => {
    createInitialSystemActivity();
    loadActivities();

    return subscribeToSocActivities(
      () => {
        if (!isPaused) {
          loadActivities();
        }
      },
    );
  }, [
    isPaused,
    loadActivities,
  ]);

  useEffect(() => {
    if (!isPaused) {
      loadActivities();
    }
  }, [
    isPaused,
    loadActivities,
  ]);

  const filteredActivities =
    useMemo(() => {
      const matchingActivities =
        categoryFilter === "all"
          ? activities
          : activities.filter(
              (activity) =>
                activity.category ===
                categoryFilter,
            );

      return matchingActivities.slice(
        0,
        MAX_VISIBLE_ACTIVITIES,
      );
    }, [
      activities,
      categoryFilter,
    ]);

  const statistics = useMemo(() => {
    return {
      visible: filteredActivities.length,

      critical: activities.filter(
        (activity) =>
          activity.severity ===
          "Critical",
      ).length,

      high: activities.filter(
        (activity) =>
          activity.severity === "High",
      ).length,

      detections: activities.filter(
        (activity) =>
          activity.category ===
          "detection",
      ).length,
    };
  }, [
    activities,
    filteredActivities.length,
  ]);

  function togglePause() {
    setIsPaused(
      (currentValue) =>
        !currentValue,
    );
  }

  async function handleRefresh() {
    setIsRefreshing(true);

    await new Promise<void>(
      (resolve) => {
        window.setTimeout(
          resolve,
          350,
        );
      },
    );

    loadActivities();
    setIsRefreshing(false);
  }

  function handleClearFeed() {
    const shouldClear =
      window.confirm(
        "Clear all saved SOC activity events?",
      );

    if (!shouldClear) {
      return;
    }

    clearSocActivities();
    createInitialSystemActivity();
    loadActivities();
  }

  function handleRemoveActivity(
    activityId: string,
  ) {
    removeSocActivity(activityId);
    loadActivities();
  }

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-green-500/15 p-3">
            <Wifi className="h-7 w-7 text-green-400" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-white">
                Live SOC Activity Feed
              </h2>

              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                  isPaused
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                    : "border-green-500/30 bg-green-500/10 text-green-300"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isPaused
                      ? "bg-amber-400"
                      : "animate-pulse bg-green-400"
                  }`}
                />

                {isPaused
                  ? "Paused"
                  : "Live"}
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-400">
              Real SentinelAI actions from uploads,
              detections, investigations, threat
              intelligence, and reports.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              void handleRefresh()
            }
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-blue-500 hover:bg-blue-500/10 hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}

            Refresh
          </button>

          <button
            type="button"
            onClick={togglePause}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              isPaused
                ? "border-green-500/40 bg-green-500/10 text-green-300 hover:bg-green-500/20"
                : "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
            }`}
          >
            {isPaused ? (
              <>
                <Play className="h-4 w-4" />
                Resume Feed
              </>
            ) : (
              <>
                <Pause className="h-4 w-4" />
                Pause Feed
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleClearFeed}
            className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </button>
        </div>
      </div>

      {analysis && (
        <div className="mt-6 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-400">
                Active Analysis
              </p>

              <p className="mt-1 break-all font-medium text-slate-200">
                {analysis.filename}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-slate-600 bg-slate-900/60 px-3 py-1.5 text-slate-300">
                {analysis.entries.toLocaleString()} events
              </span>

              <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-red-300">
                {analysis.detections.length.toLocaleString()} detections
              </span>

              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-amber-300">
                {analysis.risk_score}/100 risk
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <FeedMetric
          label="Visible Events"
          value={statistics.visible}
          icon={Activity}
          valueClass="text-blue-300"
        />

        <FeedMetric
          label="Critical Events"
          value={statistics.critical}
          icon={ShieldAlert}
          valueClass="text-red-300"
        />

        <FeedMetric
          label="High Events"
          value={statistics.high}
          icon={AlertTriangle}
          valueClass="text-orange-300"
        />

        <FeedMetric
          label="Detections"
          value={statistics.detections}
          icon={Radar}
          valueClass="text-purple-300"
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <CategoryButton
            label="All"
            value="all"
            activeValue={categoryFilter}
            onSelect={setCategoryFilter}
          />

          <CategoryButton
            label="Analysis"
            value="analysis"
            activeValue={categoryFilter}
            onSelect={setCategoryFilter}
          />

          <CategoryButton
            label="Detections"
            value="detection"
            activeValue={categoryFilter}
            onSelect={setCategoryFilter}
          />

          <CategoryButton
            label="Cases"
            value="investigation"
            activeValue={categoryFilter}
            onSelect={setCategoryFilter}
          />

          <CategoryButton
            label="Threat Intel"
            value="threat-intelligence"
            activeValue={categoryFilter}
            onSelect={setCategoryFilter}
          />

          <CategoryButton
            label="Reports"
            value="report"
            activeValue={categoryFilter}
            onSelect={setCategoryFilter}
          />

          <CategoryButton
            label="System"
            value="system"
            activeValue={categoryFilter}
            onSelect={setCategoryFilter}
          />
        </div>

        <p className="text-xs text-slate-500">
          Latest events first
        </p>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-slate-700 bg-slate-950/40">
        <div className="flex items-center justify-between border-b border-slate-700 px-5 py-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-slate-500" />

            <p className="text-sm font-semibold text-slate-300">
              Recent activity
            </p>
          </div>

          <p className="text-xs text-slate-500">
            {filteredActivities.length.toLocaleString()} event
            {filteredActivities.length === 1
              ? ""
              : "s"}
          </p>
        </div>

        {filteredActivities.length > 0 ? (
          <div className="max-h-[520px] divide-y divide-slate-800 overflow-y-auto">
            {filteredActivities.map(
              (activity) => (
                <ActivityRow
                  key={activity.id}
                  activity={activity}
                  onRemove={() =>
                    handleRemoveActivity(
                      activity.id,
                    )
                  }
                />
              ),
            )}
          </div>
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
            <Activity className="h-12 w-12 text-slate-600" />

            <h3 className="mt-4 text-lg font-semibold text-white">
              No activity available
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              Complete an upload, run an analysis, open
              a case, enrich an IP address, or generate
              a report to populate the feed.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

type FeedMetricProps = {
  label: string;
  value: number;
  icon: typeof Activity;
  valueClass: string;
};

function FeedMetric({
  label,
  value,
  icon: Icon,
  valueClass,
}: FeedMetricProps) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/40 p-4">
      <div className="flex items-center gap-2">
        <Icon
          className={`h-4 w-4 ${valueClass}`}
        />

        <p className="text-sm text-slate-400">
          {label}
        </p>
      </div>

      <p
        className={`mt-2 text-2xl font-bold ${valueClass}`}
      >
        {value.toLocaleString()}
      </p>
    </div>
  );
}

type CategoryButtonProps = {
  label: string;
  value:
    | ActivityCategory
    | "all";
  activeValue:
    | ActivityCategory
    | "all";
  onSelect: (
    value:
      | ActivityCategory
      | "all",
  ) => void;
};

function CategoryButton({
  label,
  value,
  activeValue,
  onSelect,
}: CategoryButtonProps) {
  const isActive =
    value === activeValue;

  return (
    <button
      type="button"
      onClick={() =>
        onSelect(value)
      }
      className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
        isActive
          ? "border-blue-500 bg-blue-500/15 text-blue-300"
          : "border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-600 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

type ActivityRowProps = {
  activity: SocActivity;
  onRemove: () => void;
};

function ActivityRow({
  activity,
  onRemove,
}: ActivityRowProps) {
  const style = getActivityStyle(
    activity.severity,
    activity.category,
  );

  const Icon = style.icon;

  return (
    <article
      className={`group relative border-l-2 px-5 py-4 transition hover:bg-slate-900/60 ${style.borderClass}`}
    >
      <div className="flex items-start gap-4">
        <div className="w-20 shrink-0 pt-1">
          <p className="font-mono text-xs text-slate-500">
            {formatActivityTime(
              activity.timestamp,
            )}
          </p>

          <p className="mt-1 text-[11px] text-slate-600">
            {formatActivityDate(
              activity.timestamp,
            )}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${style.iconBackgroundClass}`}
        >
          <Icon
            className={`h-5 w-5 ${style.iconClass}`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-white">
              {activity.title}
            </h3>

            <span
              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${style.badgeClass}`}
            >
              {activity.severity}
            </span>
          </div>

          <p className="mt-1 text-sm leading-6 text-slate-400">
            {activity.description}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {activity.filename && (
              <ActivityTag
                label="File"
                value={activity.filename}
              />
            )}

            {activity.sourceIp && (
              <ActivityTag
                label="IP"
                value={activity.sourceIp}
                monospace
              />
            )}

            {activity.mitreId && (
              <ActivityTag
                label="MITRE"
                value={activity.mitreId}
              />
            )}

            {activity.caseId !== undefined && (
              <ActivityTag
                label="Case"
                value={`#${activity.caseId}`}
              />
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onRemove}
          title="Remove activity"
          aria-label="Remove activity"
          className="rounded-md p-1.5 text-slate-600 opacity-0 transition hover:bg-red-500/10 hover:text-red-300 group-hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

type ActivityTagProps = {
  label: string;
  value: string;
  monospace?: boolean;
};

function ActivityTag({
  label,
  value,
  monospace = false,
}: ActivityTagProps) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-400">
      <span className="text-slate-600">
        {label}:
      </span>

      <span
        className={`max-w-52 truncate text-slate-300 ${
          monospace
            ? "font-mono"
            : ""
        }`}
      >
        {value}
      </span>
    </span>
  );
}

function getActivityStyle(
  severity: ActivitySeverity,
  category: ActivityCategory,
): ActivityStyle {
  if (severity === "Critical") {
    return {
      icon: ShieldAlert,
      iconClass: "text-red-400",
      iconBackgroundClass:
        "bg-red-500/15",
      badgeClass:
        "border-red-500/30 bg-red-500/10 text-red-300",
      borderClass:
        "border-l-red-500",
    };
  }

  if (severity === "High") {
    return {
      icon: AlertTriangle,
      iconClass: "text-orange-400",
      iconBackgroundClass:
        "bg-orange-500/15",
      badgeClass:
        "border-orange-500/30 bg-orange-500/10 text-orange-300",
      borderClass:
        "border-l-orange-500",
    };
  }

  if (severity === "Medium") {
    return {
      icon: AlertTriangle,
      iconClass: "text-amber-400",
      iconBackgroundClass:
        "bg-amber-500/15",
      badgeClass:
        "border-amber-500/30 bg-amber-500/10 text-amber-300",
      borderClass:
        "border-l-amber-500",
    };
  }

  if (severity === "Low") {
    return {
      icon: Activity,
      iconClass: "text-blue-400",
      iconBackgroundClass:
        "bg-blue-500/15",
      badgeClass:
        "border-blue-500/30 bg-blue-500/10 text-blue-300",
      borderClass:
        "border-l-blue-500",
    };
  }

  if (severity === "Success") {
    return {
      icon: CheckCircle2,
      iconClass: "text-green-400",
      iconBackgroundClass:
        "bg-green-500/15",
      badgeClass:
        "border-green-500/30 bg-green-500/10 text-green-300",
      borderClass:
        "border-l-green-500",
    };
  }

  if (category === "analysis") {
    return {
      icon: Upload,
      iconClass: "text-blue-400",
      iconBackgroundClass:
        "bg-blue-500/15",
      badgeClass:
        "border-blue-500/30 bg-blue-500/10 text-blue-300",
      borderClass:
        "border-l-blue-500",
    };
  }

  if (
    category ===
    "threat-intelligence"
  ) {
    return {
      icon: Radar,
      iconClass: "text-purple-400",
      iconBackgroundClass:
        "bg-purple-500/15",
      badgeClass:
        "border-purple-500/30 bg-purple-500/10 text-purple-300",
      borderClass:
        "border-l-purple-500",
    };
  }

  if (
    category ===
    "investigation"
  ) {
    return {
      icon: ClipboardList,
      iconClass: "text-cyan-400",
      iconBackgroundClass:
        "bg-cyan-500/15",
      badgeClass:
        "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
      borderClass:
        "border-l-cyan-500",
    };
  }

  if (category === "report") {
    return {
      icon: FileText,
      iconClass: "text-indigo-400",
      iconBackgroundClass:
        "bg-indigo-500/15",
      badgeClass:
        "border-indigo-500/30 bg-indigo-500/10 text-indigo-300",
      borderClass:
        "border-l-indigo-500",
    };
  }

  if (category === "detection") {
    return {
      icon: ShieldAlert,
      iconClass: "text-red-400",
      iconBackgroundClass:
        "bg-red-500/15",
      badgeClass:
        "border-red-500/30 bg-red-500/10 text-red-300",
      borderClass:
        "border-l-red-500",
    };
  }

  return {
    icon: Bot,
    iconClass: "text-slate-400",
    iconBackgroundClass:
      "bg-slate-500/15",
    badgeClass:
      "border-slate-500/30 bg-slate-500/10 text-slate-300",
    borderClass:
      "border-l-slate-500",
  };
}

function formatActivityTime(
  timestamp: string,
): string {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "--:--:--";
  }

  return date.toLocaleTimeString(
    [],
    {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    },
  );
}

function formatActivityDate(
  timestamp: string,
): string {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  const today = new Date();

  if (
    date.toDateString() ===
    today.toDateString()
  ) {
    return "Today";
  }

  return date.toLocaleDateString(
    [],
    {
      month: "short",
      day: "numeric",
    },
  );
}

export default LiveEventFeed;
