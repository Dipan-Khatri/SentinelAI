const API_URL = "http://127.0.0.1:8000";

const SETTINGS_STORAGE_KEY = "sentinelai_detection_settings";

export type SuspiciousIp = {
  ip: string;
  attempts: number;
  targeted_users: string[];
};

export type Detection = {
  type: string;
  severity: "Critical" | "High" | "Medium" | "Low";
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
  filename: string;
  entries: number;
  preview: string[];
  failed_logins: number;
  successful_logins: number;
  suspicious_ips: SuspiciousIp[];
  detections: Detection[];
  severity_summary: SeveritySummary;
  risk_score: number;
  risk_level: "Critical" | "High" | "Medium" | "Low";
  timeline: TimelineEvent[];
  applied_settings?: AppliedSettings;
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
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
    return DEFAULT_SETTINGS;
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

  const response = await fetch(`${API_URL}/api/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let message =
      "The backend could not analyze this file.";

    try {
      const errorData = await response.json();

      if (typeof errorData.detail === "string") {
        message = errorData.detail;
      }
    } catch {
      // Keep the default error message.
    }

    throw new Error(message);
  }

  return response.json() as Promise<UploadResult>;
}
