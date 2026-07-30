import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ExternalLink,
  Globe2,
  Network,
  Radar,
  Search,
  ShieldAlert,
} from "lucide-react";
import {
  useMemo,
  useState,
} from "react";

import type { UploadResult } from "../../services/api";

type SuspiciousIp =
  UploadResult["suspicious_ips"][number];

type ThreatIntelligenceCenterProps = {
  suspiciousIps: SuspiciousIp[];
};

type ThreatLevel =
  | "Critical"
  | "High"
  | "Medium"
  | "Low";

type ThreatProfile = {
  ip: string;
  attempts: number;
  threatLevel: ThreatLevel;
  reputationScore: number;
  recommendation: string;
};

type ThreatStyle = {
  textClass: string;
  backgroundClass: string;
  borderClass: string;
  dotClass: string;
};

function calculateThreatProfile(
  suspiciousIp: SuspiciousIp,
): ThreatProfile {
  const attempts = Math.max(
    suspiciousIp.attempts,
    0,
  );

  if (attempts >= 20) {
    return {
      ip: suspiciousIp.ip,
      attempts,
      threatLevel: "Critical",
      reputationScore: 95,
      recommendation:
        "Block the source temporarily, preserve related evidence, and begin immediate investigation.",
    };
  }

  if (attempts >= 10) {
    return {
      ip: suspiciousIp.ip,
      attempts,
      threatLevel: "High",
      reputationScore: 80,
      recommendation:
        "Investigate the source, review targeted accounts, and consider temporary blocking.",
    };
  }

  if (attempts >= 4) {
    return {
      ip: suspiciousIp.ip,
      attempts,
      threatLevel: "Medium",
      reputationScore: 60,
      recommendation:
        "Review the authentication timeline and continue monitoring the source.",
    };
  }

  return {
    ip: suspiciousIp.ip,
    attempts,
    threatLevel: "Low",
    reputationScore: 30,
    recommendation:
      "Continue monitoring and correlate the source with future authentication activity.",
  };
}

function getThreatStyle(
  threatLevel: ThreatLevel,
): ThreatStyle {
  if (threatLevel === "Critical") {
    return {
      textClass: "text-red-300",
      backgroundClass: "bg-red-500/10",
      borderClass: "border-red-500/30",
      dotClass: "bg-red-500",
    };
  }

  if (threatLevel === "High") {
    return {
      textClass: "text-orange-300",
      backgroundClass: "bg-orange-500/10",
      borderClass: "border-orange-500/30",
      dotClass: "bg-orange-500",
    };
  }

  if (threatLevel === "Medium") {
    return {
      textClass: "text-amber-300",
      backgroundClass: "bg-amber-500/10",
      borderClass: "border-amber-500/30",
      dotClass: "bg-amber-500",
    };
  }

  return {
    textClass: "text-green-300",
    backgroundClass: "bg-green-500/10",
    borderClass: "border-green-500/30",
    dotClass: "bg-green-500",
  };
}

function ThreatIntelligenceCenter({
  suspiciousIps,
}: ThreatIntelligenceCenterProps) {
  const [searchTerm, setSearchTerm] =
    useState("");

  const [selectedIp, setSelectedIp] =
    useState<string | null>(
      suspiciousIps[0]?.ip ?? null,
    );

  const threatProfiles = useMemo(
    () =>
      [...suspiciousIps]
        .sort(
          (firstIp, secondIp) =>
            secondIp.attempts -
            firstIp.attempts,
        )
        .map(calculateThreatProfile),
    [suspiciousIps],
  );

  const filteredProfiles = useMemo(() => {
    const normalizedSearch =
      searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return threatProfiles;
    }

    return threatProfiles.filter((profile) =>
      profile.ip
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [searchTerm, threatProfiles]);

  const activeProfile =
    threatProfiles.find(
      (profile) => profile.ip === selectedIp,
    ) ??
    filteredProfiles[0] ??
    threatProfiles[0];

  const criticalCount =
    threatProfiles.filter(
      (profile) =>
        profile.threatLevel === "Critical",
    ).length;

  const highRiskCount =
    threatProfiles.filter(
      (profile) =>
        profile.threatLevel === "High",
    ).length;

  const totalAttempts =
    threatProfiles.reduce(
      (total, profile) =>
        total + profile.attempts,
      0,
    );

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-indigo-500/15 p-3">
            <Radar className="h-7 w-7 text-indigo-400" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white">
              Threat Intelligence Center
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Investigate suspicious IP addresses found
              during the latest analysis.
            </p>
          </div>
        </div>

        <div className="rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-300">
          Local heuristic analysis
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <SummaryCard
          label="Suspicious Sources"
          value={threatProfiles.length}
          icon={Network}
          valueClass="text-blue-300"
        />

        <SummaryCard
          label="Critical / High"
          value={criticalCount + highRiskCount}
          icon={ShieldAlert}
          valueClass="text-red-300"
        />

        <SummaryCard
          label="Failed Attempts"
          value={totalAttempts}
          icon={AlertTriangle}
          valueClass="text-amber-300"
        />
      </div>

      {threatProfiles.length > 0 ? (
        <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-xl border border-slate-700 bg-slate-950/30 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value,
                  )
                }
                placeholder="Search suspicious IP..."
                className="w-full rounded-lg border border-slate-700 bg-slate-900 py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500"
              />
            </div>

            <div className="mt-4 max-h-[430px] space-y-3 overflow-y-auto pr-1">
              {filteredProfiles.length > 0 ? (
                filteredProfiles.map(
                  (profile) => {
                    const threatStyle =
                      getThreatStyle(
                        profile.threatLevel,
                      );

                    const isSelected =
                      activeProfile?.ip ===
                      profile.ip;

                    return (
                      <button
                        key={profile.ip}
                        type="button"
                        onClick={() =>
                          setSelectedIp(
                            profile.ip,
                          )
                        }
                        className={`w-full rounded-lg border p-4 text-left transition ${
                          isSelected
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-slate-700 bg-slate-900/60 hover:border-slate-600 hover:bg-slate-900"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span
                              className={`h-3 w-3 rounded-full ${threatStyle.dotClass}`}
                            />

                            <span className="font-mono text-sm font-semibold text-white">
                              {profile.ip}
                            </span>
                          </div>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${threatStyle.textClass} ${threatStyle.backgroundClass} ${threatStyle.borderClass}`}
                          >
                            {
                              profile.threatLevel
                            }
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-xs">
                          <span className="text-slate-500">
                            Failed attempts
                          </span>

                          <span className="font-bold text-slate-300">
                            {profile.attempts.toLocaleString()}
                          </span>
                        </div>
                      </button>
                    );
                  },
                )
              ) : (
                <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-6 text-center">
                  <Search className="mx-auto h-8 w-8 text-slate-600" />

                  <p className="mt-3 text-sm font-medium text-white">
                    No matching IP found
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Try another search value.
                  </p>
                </div>
              )}
            </div>
          </div>

          {activeProfile && (
            <ThreatProfileDetails
              profile={activeProfile}
            />
          )}
        </div>
      ) : (
        <div className="mt-6 flex min-h-80 flex-col items-center justify-center rounded-xl border border-green-500/30 bg-green-500/10 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15">
            <CheckCircle2 className="h-8 w-8 text-green-400" />
          </div>

          <h3 className="mt-5 text-lg font-semibold text-green-300">
            No suspicious sources identified
          </h3>

          <p className="mt-2 max-w-md text-sm leading-6 text-green-400">
            The latest log analysis did not identify
            any source IP addresses exceeding the
            suspicious-activity threshold.
          </p>
        </div>
      )}

      <div className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
        <p className="text-sm font-semibold text-amber-300">
          External enrichment is not connected yet
        </p>

        <p className="mt-1 text-sm leading-6 text-slate-300">
          Country, city, ASN, ISP, proxy status, abuse
          confidence, and known-malicious status require
          a real threat-intelligence provider. The current
          score is calculated only from activity observed
          in the uploaded log.
        </p>
      </div>
    </section>
  );
}

type ThreatProfileDetailsProps = {
  profile: ThreatProfile;
};

function ThreatProfileDetails({
  profile,
}: ThreatProfileDetailsProps) {
  const threatStyle = getThreatStyle(
    profile.threatLevel,
  );

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-950/30 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Selected indicator
          </p>

          <h3 className="mt-2 font-mono text-2xl font-bold text-blue-300">
            {profile.ip}
          </h3>
        </div>

        <span
          className={`rounded-full border px-4 py-2 text-sm font-semibold ${threatStyle.textClass} ${threatStyle.backgroundClass} ${threatStyle.borderClass}`}
        >
          {profile.threatLevel} Risk
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <DetailCard
          label="Observed Attempts"
          value={profile.attempts.toLocaleString()}
          icon={AlertTriangle}
          valueClass="text-red-300"
        />

        <DetailCard
          label="Local Risk Score"
          value={`${profile.reputationScore}/100`}
          icon={ShieldAlert}
          valueClass={threatStyle.textClass}
        />

        <DetailCard
          label="Country"
          value="Not enriched"
          icon={Globe2}
          valueClass="text-slate-300"
        />

        <DetailCard
          label="ASN / Provider"
          value="Not enriched"
          icon={Network}
          valueClass="text-slate-300"
        />
      </div>

      <div className="mt-6">
        <p className="text-sm font-semibold text-white">
          Activity-based score
        </p>

        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-900">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${profile.reputationScore}%`,
              background:
                profile.threatLevel ===
                "Critical"
                  ? "#ef4444"
                  : profile.threatLevel ===
                      "High"
                    ? "#f97316"
                    : profile.threatLevel ===
                        "Medium"
                      ? "#f59e0b"
                      : "#22c55e",
            }}
          />
        </div>

        <div className="mt-2 flex justify-between text-xs text-slate-500">
          <span>Low activity</span>
          <span>Severe activity</span>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
        <div className="flex items-center gap-2">
          <Ban className="h-5 w-5 text-blue-400" />

          <h4 className="font-semibold text-blue-200">
            Recommended Action
          </h4>
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-300">
          {profile.recommendation}
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <IntelStatus
          label="Abuse reputation"
          value="Not verified"
        />

        <IntelStatus
          label="Known malicious"
          value="Not verified"
        />

        <IntelStatus
          label="Proxy / VPN"
          value="Not verified"
        />

        <IntelStatus
          label="Tor exit node"
          value="Not verified"
        />
      </div>

      <button
        type="button"
        disabled
        className="mt-6 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-500"
      >
        <ExternalLink className="h-4 w-4" />
        External lookup available after API integration
      </button>
    </div>
  );
}

type SummaryCardProps = {
  label: string;
  value: number;
  icon: typeof Network;
  valueClass: string;
};

function SummaryCard({
  label,
  value,
  icon: Icon,
  valueClass,
}: SummaryCardProps) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/40 p-4">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${valueClass}`} />

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

type DetailCardProps = {
  label: string;
  value: string;
  icon: typeof Network;
  valueClass: string;
};

function DetailCard({
  label,
  value,
  icon: Icon,
  valueClass,
}: DetailCardProps) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${valueClass}`} />

        <p className="text-xs text-slate-500">
          {label}
        </p>
      </div>

      <p
        className={`mt-2 font-semibold ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}

type IntelStatusProps = {
  label: string;
  value: string;
};

function IntelStatus({
  label,
  value,
}: IntelStatusProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-3">
      <span className="text-sm text-slate-400">
        {label}
      </span>

      <span className="text-xs font-semibold text-slate-500">
        {value}
      </span>
    </div>
  );
}

export default ThreatIntelligenceCenter;
