import {
  AlertTriangle,
  Ban,
  Building2,
  CheckCircle2,
  Database,
  ExternalLink,
  Globe2,
  Loader2,
  Network,
  Radar,
  RefreshCcw,
  Search,
  ShieldAlert,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import CopyButton from "../CopyButton";
import { useToast } from "../../context/ToastContext";

import {
  addSocActivity,
} from "../../services/activityFeed";

import {
  getThreatIntelligence,
  type ThreatIntelligenceResponse,
  type UploadResult,
} from "../../services/api";

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
  targetedUsers: string[];
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

type EnrichmentState = {
  data: ThreatIntelligenceResponse | null;
  loading: boolean;
  error: string;
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
      targetedUsers:
        suspiciousIp.targeted_users ?? [],
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
      targetedUsers:
        suspiciousIp.targeted_users ?? [],
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
      targetedUsers:
        suspiciousIp.targeted_users ?? [],
      threatLevel: "Medium",
      reputationScore: 60,
      recommendation:
        "Review the authentication timeline and continue monitoring the source.",
    };
  }

  return {
    ip: suspiciousIp.ip,
    attempts,
    targetedUsers:
      suspiciousIp.targeted_users ?? [],
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
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] =
    useState("");

  const [selectedIp, setSelectedIp] =
    useState<string | null>(
      suspiciousIps[0]?.ip ?? null,
    );

  const [
    enrichmentByIp,
    setEnrichmentByIp,
  ] = useState<
    Record<string, EnrichmentState>
  >({});

  const enrichmentRef = useRef<
    Record<string, EnrichmentState>
  >({});

  useEffect(() => {
    enrichmentRef.current =
      enrichmentByIp;
  }, [enrichmentByIp]);

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

  const filteredProfiles =
    useMemo(() => {
      const normalizedSearch =
        searchTerm
          .trim()
          .toLowerCase();

      if (!normalizedSearch) {
        return threatProfiles;
      }

      return threatProfiles.filter(
        (profile) =>
          profile.ip
            .toLowerCase()
            .includes(
              normalizedSearch,
            ),
      );
    }, [
      searchTerm,
      threatProfiles,
    ]);

  const activeProfile =
    threatProfiles.find(
      (profile) =>
        profile.ip === selectedIp,
    ) ??
    filteredProfiles[0] ??
    threatProfiles[0];

  const activeEnrichment =
    activeProfile
      ? enrichmentByIp[
          activeProfile.ip
        ]
      : undefined;

  const criticalCount =
    threatProfiles.filter(
      (profile) =>
        profile.threatLevel ===
        "Critical",
    ).length;

  const highRiskCount =
    threatProfiles.filter(
      (profile) =>
        profile.threatLevel ===
        "High",
    ).length;

  const totalAttempts =
    threatProfiles.reduce(
      (total, profile) =>
        total + profile.attempts,
      0,
    );

  useEffect(() => {
    if (
      threatProfiles.length === 0
    ) {
      setSelectedIp(null);
      return;
    }

    const selectionStillExists =
      threatProfiles.some(
        (profile) =>
          profile.ip === selectedIp,
      );

    if (!selectionStillExists) {
      setSelectedIp(
        threatProfiles[0].ip,
      );
    }
  }, [
    selectedIp,
    threatProfiles,
  ]);

  const loadEnrichment =
    useCallback(
      async (
        ipAddress: string,
        forceRefresh = false,
      ) => {
        const existingState =
          enrichmentRef.current[
            ipAddress
          ];

        if (
          !forceRefresh &&
          (existingState?.loading ||
            existingState?.data)
        ) {
          return;
        }

        const profile =
          threatProfiles.find(
            (currentProfile) =>
              currentProfile.ip ===
              ipAddress,
          );

        setEnrichmentByIp(
          (currentState) => ({
            ...currentState,

            [ipAddress]: {
              data:
                currentState[
                  ipAddress
                ]?.data ?? null,

              loading: true,
              error: "",
            },
          }),
        );

        try {
          const result =
            await getThreatIntelligence(
              ipAddress,
            );

          setEnrichmentByIp(
            (currentState) => ({
              ...currentState,

              [ipAddress]: {
                data: result,
                loading: false,
                error: "",
              },
            }),
          );

          const locationText =
            result.country
              ? `${result.country}${
                  result.country_code
                    ? ` (${result.country_code})`
                    : ""
                }`
              : "an unavailable location";

          const organizationText =
            result.organization ??
            "an unidentified network organization";

          addSocActivity({
            title:
              "Threat intelligence lookup completed",

            description:
              `${ipAddress} was enriched through ${result.source}. The address is associated with ${organizationText} in ${locationText}.${
                result.cached
                  ? " Cached intelligence was used."
                  : ""
              }`,

            category:
              "threat-intelligence",

            severity:
              profile?.threatLevel ??
              "Info",

            sourceIp: ipAddress,
          });

          if (forceRefresh) {
            showToast({
              title:
                "Threat intelligence refreshed",

              message:
                `${ipAddress} was enriched successfully through ${result.source}.`,

              type: "success",
              duration: 3500,
            });
          }
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Threat-intelligence enrichment failed.";

          setEnrichmentByIp(
            (currentState) => ({
              ...currentState,

              [ipAddress]: {
                data:
                  currentState[
                    ipAddress
                  ]?.data ?? null,

                loading: false,
                error: message,
              },
            }),
          );

          addSocActivity({
            title:
              "Threat intelligence lookup failed",

            description:
              `${ipAddress} could not be enriched through IPinfo. ${message}`,

            category:
              "threat-intelligence",

            severity: "High",
            sourceIp: ipAddress,
          });

          if (forceRefresh) {
            showToast({
              title:
                "Threat intelligence unavailable",

              message,
              type: "error",
              duration: 5500,
            });
          }
        }
      },
      [
        showToast,
        threatProfiles,
      ],
    );

  useEffect(() => {
    if (!activeProfile?.ip) {
      return;
    }

    void loadEnrichment(
      activeProfile.ip,
    );
  }, [
    activeProfile?.ip,
    loadEnrichment,
  ]);

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
              Investigate suspicious IP addresses and enrich
              public sources with live network ownership data.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2 text-xs font-semibold text-green-300">
          <span className="h-2 w-2 rounded-full bg-green-400" />
          IPinfo connected
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
          value={
            criticalCount +
            highRiskCount
          }
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

            <div className="mt-4 max-h-[520px] space-y-3 overflow-y-auto pr-1">
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

                    const enrichmentState =
                      enrichmentByIp[
                        profile.ip
                      ];

                    return (
                      <div
                        key={profile.ip}
                        className={`rounded-lg border p-4 transition ${
                          isSelected
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-slate-700 bg-slate-900/60 hover:border-slate-600 hover:bg-slate-900"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedIp(
                              profile.ip,
                            )
                          }
                          className="w-full text-left"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <span
                                className={`h-3 w-3 shrink-0 rounded-full ${threatStyle.dotClass}`}
                              />

                              <span className="truncate font-mono text-sm font-semibold text-white">
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

                          <div className="mt-2 flex items-center justify-between text-xs">
                            <span className="text-slate-500">
                              Enrichment
                            </span>

                            {enrichmentState?.loading ? (
                              <span className="flex items-center gap-1.5 text-blue-300">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Loading
                              </span>
                            ) : enrichmentState?.data ? (
                              <span className="text-green-300">
                                Available
                              </span>
                            ) : enrichmentState?.error ? (
                              <span className="text-red-300">
                                Unavailable
                              </span>
                            ) : (
                              <span className="text-slate-500">
                                Not loaded
                              </span>
                            )}
                          </div>
                        </button>

                        <CopyButton
                          value={profile.ip}
                          label="Copy IP"
                          className="mt-3 w-full"
                        />
                      </div>
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
              enrichment={
                activeEnrichment
              }
              onRefresh={() =>
                void loadEnrichment(
                  activeProfile.ip,
                  true,
                )
              }
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
            The latest log analysis did not identify any
            source IP addresses exceeding the
            suspicious-activity threshold.
          </p>
        </div>
      )}

      <div className="mt-6 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
        <p className="text-sm font-semibold text-blue-300">
          Live network enrichment enabled
        </p>

        <p className="mt-1 text-sm leading-6 text-slate-300">
          Country, continent, ASN, organization, and
          organization-domain data are provided by IPinfo
          Lite. These fields identify network ownership and
          location but do not independently prove that an IP
          address is malicious.
        </p>
      </div>
    </section>
  );
}

type ThreatProfileDetailsProps = {
  profile: ThreatProfile;

  enrichment:
    | EnrichmentState
    | undefined;

  onRefresh: () => void;
};

function ThreatProfileDetails({
  profile,
  enrichment,
  onRefresh,
}: ThreatProfileDetailsProps) {
  const threatStyle =
    getThreatStyle(
      profile.threatLevel,
    );

  const intelligence =
    enrichment?.data ?? null;

  const activeRecommendation =
    intelligence?.recommendation ??
    profile.recommendation;

  const externalLookupUrl =
    `https://ipinfo.io/${encodeURIComponent(
      profile.ip,
    )}`;

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-950/30 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Selected indicator
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h3 className="break-all font-mono text-2xl font-bold text-blue-300">
              {profile.ip}
            </h3>

            <CopyButton
              value={profile.ip}
              label="Copy IP"
            />
          </div>

          {intelligence && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-1 text-xs font-semibold text-green-300">
                Enriched
              </span>

              <span className="rounded-full border border-slate-600 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300">
                {intelligence.source}
              </span>

              {intelligence.cached && (
                <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-300">
                  Cached
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onRefresh}
            disabled={
              enrichment?.loading
            }
            className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-blue-500 hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enrichment?.loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}

            Refresh
          </button>

          <span
            className={`rounded-full border px-4 py-2 text-sm font-semibold ${threatStyle.textClass} ${threatStyle.backgroundClass} ${threatStyle.borderClass}`}
          >
            {profile.threatLevel} Risk
          </span>
        </div>
      </div>

      {enrichment?.loading &&
        !intelligence && (
          <div className="mt-6 flex min-h-40 flex-col items-center justify-center rounded-lg border border-blue-500/30 bg-blue-500/10 p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />

            <p className="mt-3 font-semibold text-blue-200">
              Enriching IP address
            </p>

            <p className="mt-1 text-sm text-slate-400">
              SentinelAI is retrieving
              network intelligence from
              IPinfo.
            </p>
          </div>
        )}

      {enrichment?.error && (
        <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />

            <div>
              <p className="font-semibold text-red-300">
                Enrichment unavailable
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-300">
                {enrichment.error}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                Private, reserved,
                documentation, loopback,
                and local network addresses
                cannot be enriched through
                a public IP-intelligence
                provider.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <DetailCard
          label="Observed Attempts"
          value={profile.attempts.toLocaleString()}
          icon={AlertTriangle}
          valueClass="text-red-300"
        />

        <DetailCard
          label="Local Activity Score"
          value={`${profile.reputationScore}/100`}
          icon={ShieldAlert}
          valueClass={
            threatStyle.textClass
          }
        />

        <DetailCard
          label="Country"
          value={
            intelligence?.country
              ? formatCountry(
                  intelligence.country,
                  intelligence.country_code,
                )
              : "Unavailable"
          }
          icon={Globe2}
          valueClass={
            intelligence?.country
              ? "text-blue-300"
              : "text-slate-400"
          }
        />

        <DetailCard
          label="Continent"
          value={
            intelligence?.continent ??
            "Unavailable"
          }
          icon={Globe2}
          valueClass={
            intelligence?.continent
              ? "text-cyan-300"
              : "text-slate-400"
          }
        />

        <DetailCard
          label="ASN"
          value={
            intelligence?.asn ??
            "Unavailable"
          }
          icon={Network}
          valueClass={
            intelligence?.asn
              ? "text-purple-300"
              : "text-slate-400"
          }
          copyValue={
            intelligence?.asn ??
            undefined
          }
        />

        <DetailCard
          label="Organization"
          value={
            intelligence?.organization ??
            "Unavailable"
          }
          icon={Building2}
          valueClass={
            intelligence?.organization
              ? "text-green-300"
              : "text-slate-400"
          }
          copyValue={
            intelligence?.organization ??
            undefined
          }
        />

        <DetailCard
          label="Organization Domain"
          value={
            intelligence
              ?.organization_domain ??
            "Unavailable"
          }
          icon={ExternalLink}
          valueClass={
            intelligence
              ?.organization_domain
              ? "text-indigo-300"
              : "text-slate-400"
          }
          copyValue={
            intelligence
              ?.organization_domain ??
            undefined
          }
        />

        <DetailCard
          label="Data Source"
          value={
            intelligence?.source ??
            "IPinfo Lite"
          }
          icon={Database}
          valueClass="text-slate-300"
        />
      </div>

      {profile.targetedUsers.length >
        0 && (
        <div className="mt-6">
          <p className="text-sm font-semibold text-white">
            Targeted Accounts
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {profile.targetedUsers.map(
              (user) => (
                <div
                  key={user}
                  className="inline-flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-2"
                >
                  <span className="text-xs font-semibold text-purple-300">
                    {user}
                  </span>

                  <CopyButton
                    value={user}
                    label=""
                    copiedLabel=""
                    className="h-7 px-2 py-1"
                  />
                </div>
              ),
            )}
          </div>
        </div>
      )}

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
          {activeRecommendation}
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <IntelStatus
          label="Network ownership"
          value={
            intelligence?.organization
              ? "Verified"
              : "Unavailable"
          }
          verified={Boolean(
            intelligence?.organization,
          )}
        />

        <IntelStatus
          label="Country attribution"
          value={
            intelligence?.country
              ? "Available"
              : "Unavailable"
          }
          verified={Boolean(
            intelligence?.country,
          )}
        />

        <IntelStatus
          label="Abuse reputation"
          value="Not connected"
        />

        <IntelStatus
          label="Known malicious"
          value="Not connected"
        />

        <IntelStatus
          label="Proxy / VPN"
          value="Not connected"
        />

        <IntelStatus
          label="Tor exit node"
          value="Not connected"
        />
      </div>

      <a
        href={externalLookupUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-blue-500/40 bg-blue-500/10 px-4 py-3 text-sm font-medium text-blue-300 transition hover:border-blue-400 hover:bg-blue-500/20"
      >
        <ExternalLink className="h-4 w-4" />
        View IP on IPinfo
      </a>
    </div>
  );
}

type SummaryCardProps = {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  valueClass?: string;
};

function SummaryCard({
  label,
  value,
  icon: Icon,
  valueClass = "text-white",
}: SummaryCardProps) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
      <div className="flex items-center gap-2 text-slate-400">
        <Icon className="h-4 w-4" />
        <span className="text-sm">{label}</span>
      </div>

      <div className={`mt-2 text-3xl font-bold ${valueClass}`}>
        {value}
      </div>
    </div>
  );
}

type DetailCardProps = {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  valueClass?: string;
  copyValue?: string;
};

function DetailCard({
  label,
  value,
  icon: Icon,
  valueClass = "text-white",
  copyValue,
}: DetailCardProps) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-400">
          <Icon className="h-4 w-4" />
          <span className="text-xs uppercase tracking-wide">
            {label}
          </span>
        </div>

        {copyValue && (
          <CopyButton
            value={copyValue}
            label=""
            copiedLabel=""
            className="h-7 px-2 py-1"
          />
        )}
      </div>

      <div
        className={`mt-3 break-all text-lg font-semibold ${valueClass}`}
      >
        {value}
      </div>
    </div>
  );
}

type IntelStatusProps = {
  label: string;
  value: string;
  verified?: boolean;
};

function IntelStatus({
  label,
  value,
  verified = false,
}: IntelStatusProps) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-3">
      <div className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </div>

      <div className="mt-2 flex items-center gap-2">
        {verified ? (
          <CheckCircle2 className="h-4 w-4 text-green-400" />
        ) : (
          <Ban className="h-4 w-4 text-slate-500" />
        )}

        <span
          className={`text-sm font-medium ${
            verified
              ? "text-green-300"
              : "text-slate-400"
          }`}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

function formatCountry(
  country: string,
  code?: string | null,
) {
  if (!code) {
    return country;
  }

  return `${country} (${code})`;
}

export default ThreatIntelligenceCenter;
