import {
  Activity,
  Globe2,
  Loader2,
  MapPin,
  Radio,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getThreatIntelligence,
  type SuspiciousIp,
  type ThreatIntelligenceResponse,
} from "../../services/api";

type LiveThreatMapProps = {
  suspiciousIps: SuspiciousIp[];
};

type EnrichedThreat = {
  source: SuspiciousIp;
  intelligence: ThreatIntelligenceResponse | null;
  latitude: number;
  longitude: number;
};

type CountryCoordinate = {
  latitude: number;
  longitude: number;
};

const COUNTRY_COORDINATES: Record<
  string,
  CountryCoordinate
> = {
  US: {
    latitude: 37.1,
    longitude: -95.7,
  },
  CA: {
    latitude: 56.1,
    longitude: -106.3,
  },
  MX: {
    latitude: 23.6,
    longitude: -102.5,
  },
  BR: {
    latitude: -14.2,
    longitude: -51.9,
  },
  AR: {
    latitude: -38.4,
    longitude: -63.6,
  },
  GB: {
    latitude: 55.3,
    longitude: -3.4,
  },
  DE: {
    latitude: 51.1,
    longitude: 10.4,
  },
  FR: {
    latitude: 46.2,
    longitude: 2.2,
  },
  NL: {
    latitude: 52.1,
    longitude: 5.3,
  },
  RU: {
    latitude: 61.5,
    longitude: 105.3,
  },
  UA: {
    latitude: 48.4,
    longitude: 31.2,
  },
  CN: {
    latitude: 35.9,
    longitude: 104.2,
  },
  JP: {
    latitude: 36.2,
    longitude: 138.3,
  },
  IN: {
    latitude: 20.6,
    longitude: 79,
  },
  SG: {
    latitude: 1.35,
    longitude: 103.8,
  },
  AU: {
    latitude: -25.3,
    longitude: 133.8,
  },
  ZA: {
    latitude: -30.6,
    longitude: 22.9,
  },
  NG: {
    latitude: 9.1,
    longitude: 8.7,
  },
  EG: {
    latitude: 26.8,
    longitude: 30.8,
  },
};

const SOC_LOCATION = {
  name: "Dallas SOC",
  latitude: 32.7767,
  longitude: -96.797,
};

function LiveThreatMap({
  suspiciousIps,
}: LiveThreatMapProps) {
  const [threats, setThreats] =
    useState<EnrichedThreat[]>([]);

  const [isLoading, setIsLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    let isCancelled = false;

    async function enrichThreats() {
      if (suspiciousIps.length === 0) {
        setThreats([]);
        setErrorMessage("");
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const enrichedThreats =
          await Promise.all(
            suspiciousIps
              .slice(0, 12)
              .map(
                async (
                  source,
                ): Promise<EnrichedThreat> => {
                  try {
                    const intelligence =
                      await getThreatIntelligence(
                        source.ip,
                      );

                    const coordinate =
                      getThreatCoordinate(
                        intelligence.country_code,
                        source.ip,
                      );

                    return {
                      source,
                      intelligence,
                      ...coordinate,
                    };
                  } catch {
                    const coordinate =
                      getThreatCoordinate(
                        null,
                        source.ip,
                      );

                    return {
                      source,
                      intelligence: null,
                      ...coordinate,
                    };
                  }
                },
              ),
          );

        if (!isCancelled) {
          setThreats(
            enrichedThreats,
          );
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Threat-map enrichment is temporarily unavailable.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void enrichThreats();

    return () => {
      isCancelled = true;
    };
  }, [suspiciousIps]);

  const totalAttempts =
    useMemo(
      () =>
        threats.reduce(
          (
            total,
            threat,
          ) =>
            total +
            threat.source.attempts,
          0,
        ),
      [threats],
    );

  const countries =
    useMemo(
      () =>
        new Set(
          threats
            .map(
              (threat) =>
                threat.intelligence
                  ?.country,
            )
            .filter(Boolean),
        ).size,
      [threats],
    );

  const destination =
    projectCoordinate(
      SOC_LOCATION.latitude,
      SOC_LOCATION.longitude,
    );

  return (
    <section className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-700 p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
            Global Threat Intelligence
          </p>

          <h2 className="mt-2 text-2xl font-bold text-white">
            Live Threat Map
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Suspicious IP activity enriched with available
            geographic intelligence and visualized against
            the Dallas SOC destination.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-300">
          <Radio className="h-4 w-4 animate-pulse" />
          Active Analysis
        </div>
      </div>

      {errorMessage && (
        <div className="m-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          {errorMessage}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_320px]">
        <div className="relative min-h-[460px] overflow-hidden bg-slate-950">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.12),transparent_60%)]" />

          {isLoading ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/70">
              <div className="text-center">
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-cyan-400" />

                <p className="mt-3 text-sm text-slate-400">
                  Enriching suspicious IP addresses...
                </p>
              </div>
            </div>
          ) : null}

          <svg
            viewBox="0 0 1000 500"
            className="relative z-10 h-full min-h-[460px] w-full"
            role="img"
            aria-label="Threat activity map"
          >
            <defs>
              <linearGradient
                id="attackGradient"
                x1="0"
                y1="0"
                x2="1"
                y2="0"
              >
                <stop
                  offset="0%"
                  stopColor="#f97316"
                  stopOpacity="0.25"
                />

                <stop
                  offset="100%"
                  stopColor="#22d3ee"
                  stopOpacity="0.95"
                />
              </linearGradient>

              <filter id="pointGlow">
                <feGaussianBlur
                  stdDeviation="4"
                  result="blur"
                />

                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <WorldGrid />

            {threats.map(
              (
                threat,
                index,
              ) => {
                const source =
                  projectCoordinate(
                    threat.latitude,
                    threat.longitude,
                  );

                const path =
                  buildAttackPath(
                    source.x,
                    source.y,
                    destination.x,
                    destination.y,
                  );

                return (
                  <g
                    key={`${threat.source.ip}-${index}`}
                  >
                    <path
                      d={path}
                      fill="none"
                      stroke="url(#attackGradient)"
                      strokeWidth={
                        Math.min(
                          2 +
                            threat.source
                              .attempts *
                              0.35,
                          7,
                        )
                      }
                      strokeDasharray="9 8"
                      opacity="0.85"
                    >
                      <animate
                        attributeName="stroke-dashoffset"
                        from="34"
                        to="0"
                        dur={`${1.7 + index * 0.15}s`}
                        repeatCount="indefinite"
                      />
                    </path>

                    <circle
                      cx={source.x}
                      cy={source.y}
                      r={
                        Math.min(
                          5 +
                            threat.source
                              .attempts,
                          14,
                        )
                      }
                      fill="#f97316"
                      opacity="0.85"
                      filter="url(#pointGlow)"
                    >
                      <animate
                        attributeName="r"
                        values="5;11;5"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </circle>

                    <title>
                      {`${threat.source.ip} — ${
                        threat.intelligence
                          ?.country ??
                        "Unknown location"
                      } — ${
                        threat.source
                          .attempts
                      } attempts`}
                    </title>
                  </g>
                );
              },
            )}

            <circle
              cx={destination.x}
              cy={destination.y}
              r="12"
              fill="#22d3ee"
              opacity="0.3"
            >
              <animate
                attributeName="r"
                values="10;24;10"
                dur="2.2s"
                repeatCount="indefinite"
              />

              <animate
                attributeName="opacity"
                values="0.6;0.05;0.6"
                dur="2.2s"
                repeatCount="indefinite"
              />
            </circle>

            <circle
              cx={destination.x}
              cy={destination.y}
              r="6"
              fill="#22d3ee"
              filter="url(#pointGlow)"
            />

            <text
              x={destination.x + 12}
              y={destination.y - 12}
              fill="#67e8f9"
              fontSize="14"
              fontWeight="700"
            >
              Dallas SOC
            </text>
          </svg>

          {threats.length === 0 &&
          !isLoading ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center">
              <div className="max-w-md text-center">
                <Globe2 className="mx-auto h-12 w-12 text-slate-600" />

                <h3 className="mt-4 text-lg font-semibold text-slate-300">
                  No suspicious sources mapped
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Analyze a log containing suspicious IP
                  activity to populate the threat map.
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="border-t border-slate-700 bg-slate-900/60 p-5 lg:border-l lg:border-t-0">
          <div className="grid grid-cols-2 gap-3">
            <MapMetric
              label="Threat Sources"
              value={threats.length}
            />

            <MapMetric
              label="Countries"
              value={countries}
            />

            <MapMetric
              label="Attempts"
              value={totalAttempts}
            />

            <MapMetric
              label="Destination"
              value="Dallas"
            />
          </div>

          <div className="mt-6">
            <h3 className="flex items-center gap-2 font-semibold text-white">
              <Activity className="h-4 w-4 text-orange-400" />
              Active Sources
            </h3>

            <div className="mt-4 space-y-3">
              {threats
                .slice(0, 6)
                .map(
                  (threat) => (
                    <article
                      key={
                        threat.source.ip
                      }
                      className="rounded-lg border border-slate-700 bg-slate-950/50 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="break-all font-mono text-sm font-semibold text-orange-300">
                            {
                              threat.source
                                .ip
                            }
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {threat
                              .intelligence
                              ?.country ??
                              "Unknown location"}
                          </p>
                        </div>

                        <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-semibold text-red-300">
                          {
                            threat.source
                              .attempts
                          }
                        </span>
                      </div>

                      {threat
                        .intelligence
                        ?.organization && (
                        <p className="mt-2 truncate text-xs text-slate-400">
                          {
                            threat
                              .intelligence
                              .organization
                          }
                        </p>
                      )}
                    </article>
                  ),
                )}
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-blue-500/20 bg-blue-500/10 p-3">
            <div className="flex gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />

              <p className="text-xs leading-5 text-blue-200">
                Locations use country-level enrichment when
                available. Unknown IPs receive a stable
                visual position and are not presented as
                exact geolocation.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function MapMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-xl font-bold text-white">
        {value}
      </p>
    </div>
  );
}

function WorldGrid() {
  return (
    <g>
      <rect
        x="0"
        y="0"
        width="1000"
        height="500"
        fill="#020617"
      />

      {Array.from({
        length: 11,
      }).map((_, index) => (
        <line
          key={`vertical-${index}`}
          x1={index * 100}
          y1="0"
          x2={index * 100}
          y2="500"
          stroke="#1e293b"
          strokeWidth="1"
          opacity="0.6"
        />
      ))}

      {Array.from({
        length: 6,
      }).map((_, index) => (
        <line
          key={`horizontal-${index}`}
          x1="0"
          y1={index * 100}
          x2="1000"
          y2={index * 100}
          stroke="#1e293b"
          strokeWidth="1"
          opacity="0.6"
        />
      ))}

      <path
        d="M80 120 L145 75 L240 80 L285 125 L255 180 L190 190 L145 235 L95 210 Z"
        fill="#0f172a"
        stroke="#334155"
        strokeWidth="2"
      />

      <path
        d="M255 250 L320 275 L350 345 L315 435 L270 405 L245 330 Z"
        fill="#0f172a"
        stroke="#334155"
        strokeWidth="2"
      />

      <path
        d="M430 105 L500 80 L555 110 L595 165 L555 205 L490 190 L440 155 Z"
        fill="#0f172a"
        stroke="#334155"
        strokeWidth="2"
      />

      <path
        d="M490 215 L565 210 L615 280 L590 395 L530 420 L475 335 Z"
        fill="#0f172a"
        stroke="#334155"
        strokeWidth="2"
      />

      <path
        d="M590 95 L695 70 L820 115 L900 185 L865 245 L760 235 L700 185 L620 175 Z"
        fill="#0f172a"
        stroke="#334155"
        strokeWidth="2"
      />

      <path
        d="M790 330 L865 305 L925 340 L900 410 L835 425 L780 380 Z"
        fill="#0f172a"
        stroke="#334155"
        strokeWidth="2"
      />
    </g>
  );
}

function projectCoordinate(
  latitude: number,
  longitude: number,
) {
  return {
    x:
      ((longitude + 180) /
        360) *
      1000,

    y:
      ((90 - latitude) /
        180) *
      500,
  };
}

function buildAttackPath(
  sourceX: number,
  sourceY: number,
  destinationX: number,
  destinationY: number,
) {
  const midpointX =
    (sourceX + destinationX) /
    2;

  const midpointY =
    Math.min(
      sourceY,
      destinationY,
    ) - 70;

  return `M ${sourceX} ${sourceY} Q ${midpointX} ${midpointY} ${destinationX} ${destinationY}`;
}

function getThreatCoordinate(
  countryCode: string | null,
  ipAddress: string,
): CountryCoordinate {
  if (
    countryCode &&
    COUNTRY_COORDINATES[
      countryCode.toUpperCase()
    ]
  ) {
    return COUNTRY_COORDINATES[
      countryCode.toUpperCase()
    ];
  }

  const hash =
    Array.from(ipAddress).reduce(
      (
        total,
        character,
      ) =>
        (total * 31 +
          character.charCodeAt(
            0,
          )) %
        100000,
      7,
    );

  return {
    latitude:
      -50 + (hash % 120),

    longitude:
      -170 +
      ((hash * 13) % 340),
  };
}

export default LiveThreatMap;