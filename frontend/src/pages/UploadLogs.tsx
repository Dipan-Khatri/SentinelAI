import { useState } from "react";
import { FileText, ShieldCheck, Upload } from "lucide-react";

type FilePreview = {
  name: string;
  size: string;
  entries: number;
  lines: string[];
};

function UploadLogs() {
  const [preview, setPreview] = useState<FilePreview | null>(null);
  const [error, setError] = useState("");

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    setError("");
    setPreview(null);

    if (!file) return;

    const allowedExtensions = [".log", ".txt", ".csv", ".json"];
    const extension = file.name
      .slice(file.name.lastIndexOf("."))
      .toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      setError("Please upload a .log, .txt, .csv, or .json file.");
      event.target.value = "";
      return;
    }

    try {
      const content = await file.text();
      const logLines = content
        .split(/\r?\n/)
        .filter((line) => line.trim() !== "");

      setPreview({
        name: file.name,
        size: `${(file.size / 1024).toFixed(2)} KB`,
        entries: logLines.length,
        lines: logLines.slice(0, 5),
      });
    } catch {
      setError("SentinelAI could not read this file.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-white">
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold">Upload Security Logs</h1>

        <p className="mt-2 text-slate-400">
          Import log data for validation, detection, and investigation.
        </p>

        <label className="mt-8 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-600 bg-slate-800 px-6 py-14 transition hover:border-blue-500 hover:bg-slate-800/80">
          <Upload className="mb-4 h-10 w-10 text-blue-500" />

          <span className="text-lg font-semibold">
            Select a security log file
          </span>

          <span className="mt-2 text-sm text-slate-400">
            Supported formats: LOG, TXT, CSV, and JSON
          </span>

          <input
            type="file"
            accept=".log,.txt,.csv,.json"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {error && (
          <div className="mt-5 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}

        {preview && (
          <div className="mt-8 rounded-xl bg-slate-800 p-6 shadow-lg">
            <div className="flex items-center gap-3">
              <FileText className="h-7 w-7 text-blue-500" />

              <div>
                <h2 className="text-xl font-semibold">{preview.name}</h2>
                <p className="text-sm text-slate-400">
                  {preview.size} · {preview.entries} log entries
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-lg bg-slate-950 p-4">
              <p className="mb-3 text-sm font-semibold text-slate-300">
                File preview
              </p>

              <pre className="max-h-56 overflow-auto whitespace-pre-wrap text-sm text-slate-400">
                {preview.lines.join("\n") || "The file is empty."}
              </pre>
            </div>

            <div className="mt-5 flex items-center gap-2 text-sm text-green-400">
              <ShieldCheck className="h-5 w-5" />
              File validated and ready for backend analysis
            </div>

            <button
              type="button"
              className="mt-6 rounded-lg bg-blue-600 px-5 py-3 font-medium transition hover:bg-blue-700"
            >
              Analyze Logs
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadLogs;
