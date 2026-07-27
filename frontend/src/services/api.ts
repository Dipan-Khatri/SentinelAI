const API_URL = "http://127.0.0.1:8000";

export type UploadResult = {
  filename: string;
  entries: number;
  preview: string[];
};

export async function uploadLog(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/api/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("The backend could not analyze this file.");
  }

  return response.json();
}
