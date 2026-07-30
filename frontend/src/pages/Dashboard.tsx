import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowRight,
  Upload,
} from "lucide-react";
import { Link } from "react-router-dom";

import AICopilot from "../components/dashboard/AICopilot";
import AIIncidentSummary from "../components/dashboard/AIIncidentSummary";
import AuthenticationActivityChart from "../components/dashboard/AuthenticationActivityChart";
import AuthenticationOverview from "../components/dashboard/AuthenticationOverview";
import ExecutiveOverview from "../components/dashboard/ExecutiveOverview";
import LiveEventFeed from "../components/dashboard/LiveEventFeed";
import MitreTechniques from "../components/dashboard/MitreTechniques";
import RecentAlerts from "../components/dashboard/RecentAlerts";
import RecommendationPanel from "../components/dashboard/RecommendationPanel";
import RiskGauge from "../components/dashboard/RiskGauge";
import RiskOverview from "../components/dashboard/RiskOverview";
import SecurityActivityTimeline from "../components/dashboard/SecurityActivityTimeline";
import SeverityDistribution from "../components/dashboard/SeverityDistribution";
import ThreatIntelligenceCenter from "../components/dashboard/ThreatIntelligenceCenter";
import TopSuspiciousIps from "../components/dashboard/TopSuspiciousIps";

import {
  getInvestigations,
  type Investigation,
  type UploadResult,
} from "../services/api";

const STORAGE_KEY =
  "sentinelai_latest_analysis";

function Dashboard() {
  const [analysis, setAnalysis] =
    useState<UploadResult | null>(null);

  const [investigations, setInvestigations] =
    useState<Investigation[]>([]);

  const [caseError, setCaseError] =
    useState("");

  useEffect(() => {
    const savedAnalysis =
      localStorage.getItem(STORAGE_KEY);

    if (savedAnalysis) {
      try {
        const parsedAnalysis = JSON.parse(
          savedAnalysis,
        ) as UploadResult;

        setAnalysis(parsedAnalysis);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    async function loadInvestigations() {
      try {
        const savedInvestigations =
          await getInvestigations();

        setInvestigations(
          savedInvestigations,
        );
      } catch (error) {
        setCaseError(
          error instanceof Error
            ? error.message
            : "Investigation statistics are temporarily unavailable.",
        );
      }
    }

    void loadInvestigations();
  }, []);

  const topSuspiciousIps = useMemo(() => {
    if (!analysis) {
      return [];
    }

    return [...analysis.suspicious_ips]
      .sort(
        (firstIp, secondIp) =>
          secondIp.attempts -
          firstIp.attempts,
      )
      .slice(0, 5);
  }, [analysis]);

  const recentDetections = useMemo(() => {
    if (!analysis) {
      return [];
    }

    const severityOrder = {
      Critical: 4,
      High: 3,
      Medium: 2,
      Low: 1,
    } as const;

    return [...analysis.detections]
      .sort(
        (
          firstDetection,
          secondDetection,
        ) =>
          severityOrder[
            secondDetection.severity
          ] -
          severityOrder[
            firstDetection.severity
          ],
      )
      .slice(0, 4);
  }, [analysis]);

  if (!analysis) {
    return <EmptyDashboard />;
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 text-white sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
              SentinelAI SOC Dashboard
            </p>

            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              Good Morning, Dipan 👋
            </h1>

            <p className="mt-2 text-slate-400">
              SentinelAI analyzed{" "}
              {analysis.entries.toLocaleString()}{" "}
              security events from{" "}
              <span className="font-medium text-slate-300">
                {analysis.filename}
              </span>
              .
            </p>
          </div>

          <Link
            to="/upload"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium transition hover:bg-blue-700"
          >
            <Upload className="h-5 w-5" />
            Analyze New Logs
          </Link>
        </header>

        {caseError && (
          <div className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
            {caseError}
          </div>
        )}

        <ExecutiveOverview
          analysis={analysis}
          investigations={investigations}
        />

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <RiskOverview
            analysis={analysis}
          />

          <AuthenticationOverview
            analysis={analysis}
          />
        </section>

        <section className="mt-8 grid items-stretch gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <AuthenticationActivityChart
            analysis={analysis}
          />

          <RiskGauge
            analysis={analysis}
          />
        </section>

        <section className="mt-8">
          <AIIncidentSummary
            analysis={analysis}
          />
        </section>

        <section className="mt-8">
          <AICopilot
            analysis={analysis}
          />
        </section>

        <section className="mt-8">
          <LiveEventFeed
            analysis={analysis}
          />
        </section>

        <section className="mt-8">
          <ThreatIntelligenceCenter
            suspiciousIps={
              analysis.suspicious_ips
            }
          />
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-2">
          <RecentAlerts
            detections={recentDetections}
          />

          <TopSuspiciousIps
            suspiciousIps={
              topSuspiciousIps
            }
          />
        </section>

        <section className="mt-8 grid items-stretch gap-6 xl:grid-cols-2">
          <SeverityDistribution
            analysis={analysis}
          />

          <MitreTechniques
            detections={
              analysis.detections
            }
          />
        </section>

        <section className="mt-8 grid items-stretch gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <SecurityActivityTimeline
            analysis={analysis}
          />

          <RecommendationPanel
            analysis={analysis}
          />
        </section>
      </div>
    </div>
  );
}

function EmptyDashboard() {
  return (
    <div className="min-h-screen bg-slate-900 p-4 text-white sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold sm:text-4xl">
          Good Morning, Dipan 👋
        </h1>

        <p className="mt-2 text-slate-400">
          Your live SOC dashboard will appear
          after you analyze a security log.
        </p>

        <section className="mt-10 rounded-xl border border-dashed border-slate-600 bg-slate-800 p-8 text-center sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/15">
            <Upload className="h-8 w-8 text-blue-400" />
          </div>

          <h2 className="mt-6 text-2xl font-bold">
            No analysis data available
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-slate-400">
            Upload and analyze an authentication
            log to populate the dashboard with risk
            scores, alerts, suspicious IPs, and
            MITRE ATT&CK techniques.
          </p>

          <Link
            to="/upload"
            className="mt-7 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium transition hover:bg-blue-700"
          >
            Upload Security Logs
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
