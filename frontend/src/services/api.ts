const API_URL =
  import.meta.env.VITE_API_URL?.trim() ?? "";

const SETTINGS_STORAGE_KEY =
  "sentinelai_detection_settings";

export type RiskLevel =
  | "Critical"
  | "High"
  | "Medium"
  | "Low";

export type SuspiciousIp = {
  ip: string;
  attempts: number;
  targeted_users: string[];
};

export type Detection = {
  id?: number;
  type: string;
  severity: RiskLevel;
  mitre_id: string;
  description: string;
  confidence: number;
  source_ip: string | null;
  affected_users: string[];
  event_count: number;
  recommendations: string[];
};

export type SeveritySummary = {
  critical: number;
  high: number;
  medium: number;
  low: number;
};

export type TimelineEvent = {
  id?: number;
  line_number: number;
  timestamp: string;
  event_type:
    | "failed_login"
    | "successful_login"
    | "detection"
    | "other";
  status: string;
  title: string;
  ip: string | null;
  user: string | null;
  method: string | null;
  raw: string;
  invalid_user: boolean;
};

export type RiskWeights = {
  critical: number;
  high: number;
  medium: number;
  low: number;
};

export type DetectionSettings = {
  bruteForceThreshold: number;
  passwordSprayingThreshold: number;
  invalidUserThreshold: number;
  privilegedAccounts: string[];
  riskWeights: RiskWeights;
};

export type AppliedSettings = {
  brute_force_threshold: number;
  password_spraying_threshold: number;
  invalid_user_threshold: number;
  privileged_accounts: string[];
  risk_weights: RiskWeights;
};

export type UploadResult = {
  analysis_id?: number;
  saved_to_database?: boolean;
  filename: string;
  entries: number;
  preview: string[];
  failed_logins: number;
  successful_logins: number;
  suspicious_ips: SuspiciousIp[];
  detections: Detection[];
  severity_summary: SeveritySummary;
  risk_score: number;
  risk_level: RiskLevel;
  timeline: TimelineEvent[];
  applied_settings?: AppliedSettings;
};

export type AnalysisHistoryItem = {
  id: number;
  filename: string;
  upload_time: string | null;
  entries: number;
  failed_logins: number;
  successful_logins: number;
  risk_score: number;
  risk_level: RiskLevel;
  detection_count: number;
  timeline_event_count?: number;
  investigation_count?: number;
};

export type HistoricalAnalysisDetail = {
  id: number;
  filename: string;
  upload_time: string | null;
  entries: number;
  failed_logins: number;
  successful_logins: number;
  risk_score: number;
  risk_level: RiskLevel;
  detections: Detection[];
  timeline: TimelineEvent[];
};

export type DeleteAnalysisResponse = {
  message: string;
  analysis_id: number;
  filename: string;
};

export type InvestigationStatus =
  | "Open"
  | "In Progress"
  | "Resolved"
  | "False Positive";

export type Investigation = {
  id: number;
  analysis_id: number;
  detection_id: number;
  status: InvestigationStatus;
  analyst: string;
  notes: string;
  completed_actions: string[];
  created_at: string | null;
  updated_at: string | null;
};

export type SaveInvestigationPayload = {
  analysis_id: number;
  detection_id: number;
  status: InvestigationStatus;
  analyst: string;
  notes: string;
  completed_actions: string[];
};

export type UpdateInvestigationPayload = {
  status: InvestigationStatus;
  analyst: string;
  notes: string;
  completed_actions: string[];
};

export type ThreatIntelligenceResponse = {
  ip: string;
  country_code: string | null;
  country: string | null;
  continent_code: string | null;
  continent: string | null;
  asn: string | null;
  organization: string | null;
  organization_domain: string | null;
  source: string;
  cached: boolean;
  recommendation: string;
};

export type ClearThreatIntelligenceCacheResponse = {
  message: string;
  removed_entries: number;
};

const DEFAULT_SETTINGS: DetectionSettings = {
  bruteForceThreshold: 3,
  passwordSprayingThreshold: 3,
  invalidUserThreshold: 2,

  privilegedAccounts: [
    "root",
    "admin",
    "administrator",
  ],

  riskWeights: {
    critical: 50,
    high: 30,
    medium: 15,
    low: 5,
  },
};

function getDetectionSettings(): DetectionSettings {
  const savedSettings = localStorage.getItem(
    SETTINGS_STORAGE_KEY,
  );

  if (!savedSettings) {
    return DEFAULT_SETTINGS;
  }

  try {
    const parsedSettings = JSON.parse(
      savedSettings,
    ) as Partial<DetectionSettings>;

    return {
      bruteForceThreshold:
        parsedSettings.bruteForceThreshold ??
        DEFAULT_SETTINGS.bruteForceThreshold,

      passwordSprayingThreshold:
        parsedSettings.passwordSprayingThreshold ??
        DEFAULT_SETTINGS.passwordSprayingThreshold,

      invalidUserThreshold:
        parsedSettings.invalidUserThreshold ??
        DEFAULT_SETTINGS.invalidUserThreshold,

      privilegedAccounts:
        parsedSettings.privilegedAccounts ??
        DEFAULT_SETTINGS.privilegedAccounts,

      riskWeights: {
        critical:
          parsedSettings.riskWeights?.critical ??
          DEFAULT_SETTINGS.riskWeights.critical,

        high:
          parsedSettings.riskWeights?.high ??
          DEFAULT_SETTINGS.riskWeights.high,

        medium:
          parsedSettings.riskWeights?.medium ??
          DEFAULT_SETTINGS.riskWeights.medium,

        low:
          parsedSettings.riskWeights?.low ??
          DEFAULT_SETTINGS.riskWeights.low,
      },
    };
  } catch {
    localStorage.removeItem(
      SETTINGS_STORAGE_KEY,
    );

    return DEFAULT_SETTINGS;
  }
}

function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/")
    ? path
    : `/${path}`;

  if (!API_URL) {
    return normalizedPath;
  }

  return `${API_URL.replace(
    /\/+$/,
    "",
  )}${normalizedPath}`;
}

async function getErrorMessage(
  response: Response,
  fallbackMessage: string,
): Promise<string> {
  try {
    const errorData = (await response.json()) as {
      detail?: unknown;
      message?: unknown;
    };

    if (typeof errorData.detail === "string") {
      return errorData.detail;
    }

    if (typeof errorData.message === "string") {
      return errorData.message;
    }
  } catch {
    // The API did not return JSON.
  }

  return fallbackMessage;
}

async function apiFetch(
  path: string,
  options?: RequestInit,
): Promise<Response> {
  try {
    return await fetch(
      buildApiUrl(path),
      options,
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown network error.";

    throw new Error(
      `SentinelAI could not connect to the backend. ${message}`,
    );
  }
}

export async function uploadLog(
  file: File,
): Promise<UploadResult> {
  const formData = new FormData();
  const settings = getDetectionSettings();

  formData.append("file", file);

  formData.append(
    "settings",
    JSON.stringify(settings),
  );

  const response = await apiFetch(
    "/api/upload",
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    const message = await getErrorMessage(
      response,
      "The backend could not analyze this file.",
    );

    throw new Error(message);
  }

  return response.json() as Promise<UploadResult>;
}

export async function getAnalyses(): Promise<
  AnalysisHistoryItem[]
> {
  const response = await apiFetch(
    "/api/analyses",
  );

  if (!response.ok) {
    const message = await getErrorMessage(
      response,
      "SentinelAI could not load analysis history.",
    );

    throw new Error(message);
  }

  return response.json() as Promise<
    AnalysisHistoryItem[]
  >;
}

export async function getAnalysisById(
  analysisId: number,
): Promise<HistoricalAnalysisDetail> {
  const response = await apiFetch(
    `/api/analyses/${analysisId}`,
  );

  if (!response.ok) {
    const message = await getErrorMessage(
      response,
      "SentinelAI could not load this analysis.",
    );

    throw new Error(message);
  }

  return response.json() as Promise<
    HistoricalAnalysisDetail
  >;
}

export async function deleteAnalysis(
  analysisId: number,
): Promise<DeleteAnalysisResponse> {
  const response = await apiFetch(
    `/api/analyses/${analysisId}`,
    {
      method: "DELETE",
    },
  );

  if (!response.ok) {
    const message = await getErrorMessage(
      response,
      "SentinelAI could not delete this analysis.",
    );

    throw new Error(message);
  }

  return response.json() as Promise<
    DeleteAnalysisResponse
  >;
}

export async function getInvestigation(
  analysisId: number,
  detectionId: number,
): Promise<Investigation | null> {
  const searchParameters =
    new URLSearchParams({
      analysis_id: String(analysisId),
      detection_id: String(detectionId),
    });

  const response = await apiFetch(
    `/api/investigations/lookup?${searchParameters.toString()}`,
  );

  if (!response.ok) {
    const message = await getErrorMessage(
      response,
      "SentinelAI could not load this investigation.",
    );

    throw new Error(message);
  }

  return response.json() as Promise<
    Investigation | null
  >;
}

export async function getInvestigations(
  analysisId?: number,
): Promise<Investigation[]> {
  const path =
    analysisId === undefined
      ? "/api/investigations"
      : `/api/investigations?analysis_id=${analysisId}`;

  const response = await apiFetch(path);

  if (!response.ok) {
    const message = await getErrorMessage(
      response,
      "SentinelAI could not load investigations.",
    );

    throw new Error(message);
  }

  return response.json() as Promise<
    Investigation[]
  >;
}

export async function saveInvestigation(
  payload: SaveInvestigationPayload,
): Promise<Investigation> {
  const response = await apiFetch(
    "/api/investigations",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const message = await getErrorMessage(
      response,
      "SentinelAI could not save the investigation.",
    );

    throw new Error(message);
  }

  return response.json() as Promise<Investigation>;
}

export async function updateInvestigation(
  investigationId: number,
  payload: UpdateInvestigationPayload,
): Promise<Investigation> {
  const response = await apiFetch(
    `/api/investigations/${investigationId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const message = await getErrorMessage(
      response,
      "SentinelAI could not update the investigation.",
    );

    throw new Error(message);
  }

  return response.json() as Promise<Investigation>;
}

export async function getThreatIntelligence(
  ipAddress: string,
): Promise<ThreatIntelligenceResponse> {
  const normalizedIp = ipAddress.trim();

  if (!normalizedIp) {
    throw new Error(
      "An IP address is required for threat-intelligence enrichment.",
    );
  }

  const response = await apiFetch(
    `/api/threat-intel/${encodeURIComponent(
      normalizedIp,
    )}`,
  );

  if (!response.ok) {
    const message = await getErrorMessage(
      response,
      "SentinelAI could not enrich this IP address.",
    );

    throw new Error(message);
  }

  return response.json() as Promise<
    ThreatIntelligenceResponse
  >;
}

export async function clearThreatIntelligenceCache(): Promise<
  ClearThreatIntelligenceCacheResponse
> {
  const response = await apiFetch(
    "/api/threat-intel/cache",
    {
      method: "DELETE",
    },
  );

  if (!response.ok) {
    const message = await getErrorMessage(
      response,
      "SentinelAI could not clear the threat-intelligence cache.",
    );

    throw new Error(message);
  }

  return response.json() as Promise<
    ClearThreatIntelligenceCacheResponse
  >;
}

export function historicalAnalysisToUploadResult(
  historicalAnalysis: HistoricalAnalysisDetail,
): UploadResult {
  const severitySummary: SeveritySummary = {
    critical:
      historicalAnalysis.detections.filter(
        (detection) =>
          detection.severity === "Critical",
      ).length,

    high: historicalAnalysis.detections.filter(
      (detection) =>
        detection.severity === "High",
    ).length,

    medium:
      historicalAnalysis.detections.filter(
        (detection) =>
          detection.severity === "Medium",
      ).length,

    low: historicalAnalysis.detections.filter(
      (detection) =>
        detection.severity === "Low",
    ).length,
  };

  const suspiciousIpMap = new Map<
    string,
    SuspiciousIp
  >();

  historicalAnalysis.detections.forEach(
    (detection) => {
      if (!detection.source_ip) {
        return;
      }

      const existingIp = suspiciousIpMap.get(
        detection.source_ip,
      );

      if (existingIp) {
        existingIp.attempts = Math.max(
          existingIp.attempts,
          detection.event_count,
        );

        existingIp.targeted_users =
          Array.from(
            new Set([
              ...existingIp.targeted_users,
              ...detection.affected_users,
            ]),
          );

        return;
      }

      suspiciousIpMap.set(
        detection.source_ip,
        {
          ip: detection.source_ip,
          attempts: detection.event_count,
          targeted_users: [
            ...detection.affected_users,
          ],
        },
      );
    },
  );

  return {
    analysis_id: historicalAnalysis.id,
    saved_to_database: true,
    filename: historicalAnalysis.filename,
    entries: historicalAnalysis.entries,
    preview: [],
    failed_logins:
      historicalAnalysis.failed_logins,
    successful_logins:
      historicalAnalysis.successful_logins,
    suspicious_ips: Array.from(
      suspiciousIpMap.values(),
    ),
    detections:
      historicalAnalysis.detections,
    severity_summary: severitySummary,
    risk_score:
      historicalAnalysis.risk_score,
    risk_level:
      historicalAnalysis.risk_level,
    timeline:
      historicalAnalysis.timeline ?? [],
  };
}
