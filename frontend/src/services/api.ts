const API_URL = "http://127.0.0.1:8000";

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

export type UploadResult = {
  filename: string;
  entries: number;
  preview: string[];
  failed_logins: number;
  successful_logins: number;
  suspicious_ips: SuspiciousIp[];
  detections: Detection[];
  severity_summary: SeveritySummary;
  timeline: TimelineEvent[];
};

export async function uploadLog(
  file: File,
): Promise<UploadResult> {
  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch(
    `${API_URL}/api/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

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

  return response.json();
}
