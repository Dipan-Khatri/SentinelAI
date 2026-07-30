import {
  ArrowRight,
  FileSearch,
} from "lucide-react";
import { Link } from "react-router-dom";

import type { Detection } from "../../services/api";

type Props = {
  detections: Detection[];
};

function MitreTechniques({
  detections,
}: Props) {
  const techniques = Array.from(
    new Set(
      detections.map(
        (detection) => detection.mitre_id,
      ),
    ),
  );

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-blue-500/15 p-3">
          <FileSearch className="h-7 w-7 text-blue-400" />
        </div>

        <div>
          <h2 className="text-2xl font-bold">
            MITRE ATT&CK
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Techniques identified during the latest analysis.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {techniques.length > 0 ? (
          techniques.map((technique) => (
            <span
              key={technique}
              className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 font-mono font-semibold text-blue-300"
            >
              {technique}
            </span>
          ))
        ) : (
          <p className="text-sm text-slate-400">
            No MITRE ATT&CK techniques were detected.
          </p>
        )}
      </div>

      <Link
        to="/mitre"
        className="mt-6 flex items-center gap-2 text-sm font-medium text-blue-400 transition hover:text-blue-300"
      >
        Open MITRE Explorer
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}

export default MitreTechniques;
