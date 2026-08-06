export type ActivitySeverity =
  | "Critical"
  | "High"
  | "Medium"
  | "Low"
  | "Info"
  | "Success";

export type ActivityCategory =
  | "analysis"
  | "detection"
  | "investigation"
  | "threat-intelligence"
  | "report"
  | "system";

export type SocActivity = {
  id: string;
  title: string;
  description: string;
  category: ActivityCategory;
  severity: ActivitySeverity;
  timestamp: string;
  sourceIp?: string;
  filename?: string;
  mitreId?: string;
  caseId?: number;
};

export type AddSocActivityInput = {
  title: string;
  description: string;
  category: ActivityCategory;
  severity?: ActivitySeverity;
  sourceIp?: string;
  filename?: string;
  mitreId?: string;
  caseId?: number;
};

const ACTIVITY_STORAGE_KEY =
  "sentinelai_soc_activity_feed";

const ACTIVITY_UPDATED_EVENT =
  "sentinelai:soc-activity-updated";

const MAX_STORED_ACTIVITIES = 100;

function createActivityId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function isSocActivity(
  value: unknown,
): value is SocActivity {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const activity =
    value as Partial<SocActivity>;

  return (
    typeof activity.id === "string" &&
    typeof activity.title === "string" &&
    typeof activity.description ===
      "string" &&
    typeof activity.category ===
      "string" &&
    typeof activity.severity ===
      "string" &&
    typeof activity.timestamp ===
      "string"
  );
}

export function getSocActivities(): SocActivity[] {
  try {
    const storedActivities =
      localStorage.getItem(
        ACTIVITY_STORAGE_KEY,
      );

    if (!storedActivities) {
      return [];
    }

    const parsedActivities =
      JSON.parse(storedActivities) as unknown;

    if (!Array.isArray(parsedActivities)) {
      localStorage.removeItem(
        ACTIVITY_STORAGE_KEY,
      );

      return [];
    }

    return parsedActivities
      .filter(isSocActivity)
      .sort(
        (firstActivity, secondActivity) =>
          new Date(
            secondActivity.timestamp,
          ).getTime() -
          new Date(
            firstActivity.timestamp,
          ).getTime(),
      );
  } catch {
    localStorage.removeItem(
      ACTIVITY_STORAGE_KEY,
    );

    return [];
  }
}

export function addSocActivity(
  input: AddSocActivityInput,
): SocActivity {
  const activity: SocActivity = {
    id: createActivityId(),
    title: input.title,
    description: input.description,
    category: input.category,
    severity: input.severity ?? "Info",
    timestamp:
      new Date().toISOString(),
    sourceIp: input.sourceIp,
    filename: input.filename,
    mitreId: input.mitreId,
    caseId: input.caseId,
  };

  const currentActivities =
    getSocActivities();

  const updatedActivities = [
    activity,
    ...currentActivities,
  ].slice(0, MAX_STORED_ACTIVITIES);

  localStorage.setItem(
    ACTIVITY_STORAGE_KEY,
    JSON.stringify(updatedActivities),
  );

  window.dispatchEvent(
    new CustomEvent(
      ACTIVITY_UPDATED_EVENT,
      {
        detail: activity,
      },
    ),
  );

  return activity;
}

export function clearSocActivities(): void {
  localStorage.removeItem(
    ACTIVITY_STORAGE_KEY,
  );

  window.dispatchEvent(
    new CustomEvent(
      ACTIVITY_UPDATED_EVENT,
    ),
  );
}

export function removeSocActivity(
  activityId: string,
): void {
  const updatedActivities =
    getSocActivities().filter(
      (activity) =>
        activity.id !== activityId,
    );

  localStorage.setItem(
    ACTIVITY_STORAGE_KEY,
    JSON.stringify(updatedActivities),
  );

  window.dispatchEvent(
    new CustomEvent(
      ACTIVITY_UPDATED_EVENT,
    ),
  );
}

export function subscribeToSocActivities(
  callback: () => void,
): () => void {
  function handleActivityUpdate() {
    callback();
  }

  function handleStorageUpdate(
    event: StorageEvent,
  ) {
    if (
      event.key ===
      ACTIVITY_STORAGE_KEY
    ) {
      callback();
    }
  }

  window.addEventListener(
    ACTIVITY_UPDATED_EVENT,
    handleActivityUpdate,
  );

  window.addEventListener(
    "storage",
    handleStorageUpdate,
  );

  return () => {
    window.removeEventListener(
      ACTIVITY_UPDATED_EVENT,
      handleActivityUpdate,
    );

    window.removeEventListener(
      "storage",
      handleStorageUpdate,
    );
  };
}

export function createInitialSystemActivity(): void {
  const currentActivities =
    getSocActivities();

  if (currentActivities.length > 0) {
    return;
  }

  addSocActivity({
    title: "SentinelAI session started",
    description:
      "The SOC dashboard initialized and is ready to process security events.",
    category: "system",
    severity: "Success",
  });
}
