from collections import Counter, defaultdict
from pathlib import Path
import re
from typing import Any


FAILED_LOGIN_PATTERN = re.compile(
    r"Failed password for (?:(?:invalid user) )?(?P<user>\S+) "
    r"from (?P<ip>(?:\d{1,3}\.){3}\d{1,3})"
)

SUCCESSFUL_LOGIN_PATTERN = re.compile(
    r"Accepted (?P<method>password|publickey) for (?P<user>\S+) "
    r"from (?P<ip>(?:\d{1,3}\.){3}\d{1,3})"
)

TIMESTAMP_PATTERN = re.compile(
    r"^(?P<month>[A-Z][a-z]{2})\s+"
    r"(?P<day>\d{1,2})\s+"
    r"(?P<time>\d{2}:\d{2}:\d{2})"
)


DEFAULT_SETTINGS: dict[str, Any] = {
    "bruteForceThreshold": 3,
    "passwordSprayingThreshold": 3,
    "invalidUserThreshold": 2,
    "privilegedAccounts": [
        "root",
        "admin",
        "administrator",
    ],
    "riskWeights": {
        "critical": 50,
        "high": 30,
        "medium": 15,
        "low": 5,
    },
}


def clamp_integer(
    value: Any,
    default: int,
    minimum: int,
    maximum: int,
) -> int:
    if isinstance(value, bool):
        return default

    try:
        converted_value = int(value)
    except (TypeError, ValueError):
        return default

    return max(
        minimum,
        min(maximum, converted_value),
    )


def normalize_privileged_accounts(
    value: Any,
) -> set[str]:
    default_accounts = {
        account.lower()
        for account in DEFAULT_SETTINGS[
            "privilegedAccounts"
        ]
    }

    if not isinstance(value, list):
        return default_accounts

    normalized_accounts = {
        str(account).strip().lower()
        for account in value
        if str(account).strip()
    }

    if not normalized_accounts:
        return default_accounts

    return normalized_accounts


def normalize_settings(
    settings: dict[str, Any] | None,
) -> dict[str, Any]:
    supplied_settings = (
        settings
        if isinstance(settings, dict)
        else {}
    )

    supplied_risk_weights = supplied_settings.get(
        "riskWeights",
        {},
    )

    if not isinstance(supplied_risk_weights, dict):
        supplied_risk_weights = {}

    default_risk_weights = DEFAULT_SETTINGS[
        "riskWeights"
    ]

    return {
        "brute_force_threshold": clamp_integer(
            supplied_settings.get(
                "bruteForceThreshold",
            ),
            default=DEFAULT_SETTINGS[
                "bruteForceThreshold"
            ],
            minimum=2,
            maximum=50,
        ),
        "password_spraying_threshold": clamp_integer(
            supplied_settings.get(
                "passwordSprayingThreshold",
            ),
            default=DEFAULT_SETTINGS[
                "passwordSprayingThreshold"
            ],
            minimum=2,
            maximum=25,
        ),
        "invalid_user_threshold": clamp_integer(
            supplied_settings.get(
                "invalidUserThreshold",
            ),
            default=DEFAULT_SETTINGS[
                "invalidUserThreshold"
            ],
            minimum=2,
            maximum=25,
        ),
        "privileged_accounts": normalize_privileged_accounts(
            supplied_settings.get(
                "privilegedAccounts",
            )
        ),
        "risk_weights": {
            "Critical": clamp_integer(
                supplied_risk_weights.get("critical"),
                default=default_risk_weights[
                    "critical"
                ],
                minimum=0,
                maximum=100,
            ),
            "High": clamp_integer(
                supplied_risk_weights.get("high"),
                default=default_risk_weights["high"],
                minimum=0,
                maximum=100,
            ),
            "Medium": clamp_integer(
                supplied_risk_weights.get("medium"),
                default=default_risk_weights[
                    "medium"
                ],
                minimum=0,
                maximum=100,
            ),
            "Low": clamp_integer(
                supplied_risk_weights.get("low"),
                default=default_risk_weights["low"],
                minimum=0,
                maximum=100,
            ),
        },
    }


def create_detection(
    detection_type: str,
    severity: str,
    mitre_id: str,
    description: str,
    confidence: int,
    source_ip: str | None = None,
    affected_users: list[str] | None = None,
    event_count: int = 0,
    recommendations: list[str] | None = None,
) -> dict[str, Any]:
    return {
        "type": detection_type,
        "severity": severity,
        "mitre_id": mitre_id,
        "description": description,
        "confidence": confidence,
        "source_ip": source_ip,
        "affected_users": affected_users or [],
        "event_count": event_count,
        "recommendations": recommendations or [],
    }


def extract_timestamp(line: str) -> str:
    match = TIMESTAMP_PATTERN.search(line)

    if not match:
        return "Unknown time"

    return (
        f"{match.group('month')} "
        f"{match.group('day')} "
        f"{match.group('time')}"
    )


def calculate_risk_score(
    detections: list[dict[str, Any]],
    failed_logins: int,
    successful_logins: int,
    risk_weights: dict[str, int],
) -> tuple[int, str]:
    score = 0.0

    for detection in detections:
        severity = detection.get(
            "severity",
            "Low",
        )

        confidence = clamp_integer(
            detection.get("confidence"),
            default=0,
            minimum=0,
            maximum=100,
        )

        severity_weight = risk_weights.get(
            severity,
            0,
        )

        confidence_multiplier = confidence / 100

        score += (
            severity_weight
            * confidence_multiplier
        )

    # Add authentication activity context.
    score += min(failed_logins * 2, 15)
    score += min(successful_logins, 5)

    final_score = min(
        100,
        max(0, round(score)),
    )

    if final_score >= 75:
        risk_level = "Critical"
    elif final_score >= 50:
        risk_level = "High"
    elif final_score >= 25:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    return final_score, risk_level


def parse_log(
    file_path: str,
    original_filename: str | None = None,
    settings: dict[str, Any] | None = None,
) -> dict[str, Any]:
    path = Path(file_path)

    if not path.exists():
        return {
            "error": "File not found",
        }

    normalized_settings = normalize_settings(settings)

    brute_force_threshold = normalized_settings[
        "brute_force_threshold"
    ]

    password_spraying_threshold = normalized_settings[
        "password_spraying_threshold"
    ]

    invalid_user_threshold = normalized_settings[
        "invalid_user_threshold"
    ]

    privileged_accounts: set[str] = normalized_settings[
        "privileged_accounts"
    ]

    risk_weights: dict[str, int] = normalized_settings[
        "risk_weights"
    ]

    with path.open(
        "r",
        encoding="utf-8",
        errors="ignore",
    ) as log_file:
        lines = [
            line.rstrip("\r\n")
            for line in log_file
            if line.strip()
        ]

    failed_events: list[dict[str, Any]] = []
    successful_events: list[dict[str, Any]] = []
    timeline: list[dict[str, Any]] = []

    for index, line in enumerate(lines):
        timestamp = extract_timestamp(line)

        failed_match = FAILED_LOGIN_PATTERN.search(line)

        if failed_match:
            event = {
                "line_number": index,
                "timestamp": timestamp,
                "event_type": "failed_login",
                "status": "Failed",
                "title": "Failed SSH login",
                "ip": failed_match.group("ip"),
                "user": failed_match.group("user"),
                "method": "password",
                "raw": line,
                "invalid_user": (
                    "invalid user"
                    in line.lower()
                ),
            }

            failed_events.append(event)
            timeline.append(event)
            continue

        successful_match = (
            SUCCESSFUL_LOGIN_PATTERN.search(line)
        )

        if successful_match:
            event = {
                "line_number": index,
                "timestamp": timestamp,
                "event_type": "successful_login",
                "status": "Successful",
                "title": "Successful SSH login",
                "ip": successful_match.group("ip"),
                "user": successful_match.group("user"),
                "method": successful_match.group(
                    "method"
                ),
                "raw": line,
                "invalid_user": False,
            }

            successful_events.append(event)
            timeline.append(event)
            continue

        timeline.append(
            {
                "line_number": index,
                "timestamp": timestamp,
                "event_type": "other",
                "status": "Informational",
                "title": "Authentication log event",
                "ip": None,
                "user": None,
                "method": None,
                "raw": line,
                "invalid_user": False,
            }
        )

    failures_by_ip: Counter[str] = Counter(
        event["ip"]
        for event in failed_events
    )

    users_by_ip: defaultdict[
        str,
        set[str],
    ] = defaultdict(set)

    for event in failed_events:
        users_by_ip[event["ip"]].add(
            event["user"]
        )

    suspicious_ips = [
        {
            "ip": ip,
            "attempts": attempts,
            "targeted_users": sorted(
                users_by_ip[ip]
            ),
        }
        for ip, attempts in failures_by_ip.items()
        if attempts >= brute_force_threshold
    ]

    detections: list[dict[str, Any]] = []

    # Rule 1: Brute force
    for ip, attempts in failures_by_ip.items():
        if attempts >= brute_force_threshold:
            targeted_users = sorted(
                users_by_ip[ip]
            )

            detections.append(
                create_detection(
                    detection_type="Brute Force",
                    severity="High",
                    mitre_id="T1110",
                    description=(
                        f"{ip} generated {attempts} failed "
                        f"login attempts against "
                        f"{len(targeted_users)} account(s). "
                        f"The configured threshold is "
                        f"{brute_force_threshold} attempts."
                    ),
                    confidence=min(
                        95,
                        70 + attempts * 5,
                    ),
                    source_ip=ip,
                    affected_users=targeted_users,
                    event_count=attempts,
                    recommendations=[
                        "Block or monitor the suspicious source IP.",
                        "Review authentication activity for the targeted accounts.",
                        "Check whether any successful login followed the failures.",
                        "Reset credentials if compromise is suspected.",
                    ],
                )
            )

            last_failed_event = max(
                (
                    event
                    for event in failed_events
                    if event["ip"] == ip
                ),
                key=lambda event: event[
                    "line_number"
                ],
            )

            timeline.append(
                {
                    "line_number": (
                        last_failed_event[
                            "line_number"
                        ]
                        + 0.5
                    ),
                    "timestamp": last_failed_event[
                        "timestamp"
                    ],
                    "event_type": "detection",
                    "status": "Alert",
                    "title": (
                        "Brute-force detection "
                        "triggered"
                    ),
                    "ip": ip,
                    "user": ", ".join(
                        targeted_users
                    ),
                    "method": None,
                    "raw": (
                        "SentinelAI detected "
                        f"{attempts} failed login "
                        f"attempts from {ip}. "
                        "Configured threshold: "
                        f"{brute_force_threshold}."
                    ),
                    "invalid_user": False,
                }
            )

    # Rule 2: Password spraying
    for ip, targeted_users in users_by_ip.items():
        if (
            len(targeted_users)
            >= password_spraying_threshold
        ):
            detections.append(
                create_detection(
                    detection_type=(
                        "Password Spraying"
                    ),
                    severity="High",
                    mitre_id="T1110.003",
                    description=(
                        f"{ip} attempted authentication "
                        f"against {len(targeted_users)} "
                        "different accounts. The "
                        "configured threshold is "
                        f"{password_spraying_threshold} "
                        "accounts."
                    ),
                    confidence=min(
                        95,
                        75
                        + len(targeted_users) * 5,
                    ),
                    source_ip=ip,
                    affected_users=sorted(
                        targeted_users
                    ),
                    event_count=failures_by_ip[ip],
                    recommendations=[
                        "Review all targeted accounts for compromise.",
                        "Enable or verify multifactor authentication.",
                        "Block or rate-limit the source IP.",
                        "Search for similar activity across other systems.",
                    ],
                )
            )

    # Rule 3: Privileged account targeting
    privileged_events = [
        event
        for event in failed_events
        if event["user"].lower()
        in privileged_accounts
    ]

    privileged_events_by_ip: defaultdict[
        str,
        list[dict[str, Any]],
    ] = defaultdict(list)

    for event in privileged_events:
        privileged_events_by_ip[
            event["ip"]
        ].append(event)

    for ip, events in (
        privileged_events_by_ip.items()
    ):
        targeted_users = sorted(
            {
                event["user"]
                for event in events
            }
        )

        detections.append(
            create_detection(
                detection_type=(
                    "Privileged Account Targeting"
                ),
                severity="Medium",
                mitre_id="T1110.001",
                description=(
                    f"{ip} attempted to authenticate "
                    "to configured privileged "
                    f"account(s): "
                    f"{', '.join(targeted_users)}."
                ),
                confidence=min(
                    90,
                    65 + len(events) * 5,
                ),
                source_ip=ip,
                affected_users=targeted_users,
                event_count=len(events),
                recommendations=[
                    "Review the privileged accounts for unusual activity.",
                    "Verify that strong passwords and MFA are enabled.",
                    "Monitor the source IP for additional authentication attempts.",
                ],
            )
        )

    # Rule 4: Successful login after repeated failures
    for success_event in successful_events:
        prior_failures = [
            event
            for event in failed_events
            if (
                event["ip"]
                == success_event["ip"]
                and event["line_number"]
                < success_event["line_number"]
            )
        ]

        if (
            len(prior_failures)
            >= brute_force_threshold
        ):
            detections.append(
                create_detection(
                    detection_type=(
                        "Successful Login After "
                        "Failures"
                    ),
                    severity="Critical",
                    mitre_id="T1078",
                    description=(
                        f"{success_event['ip']} "
                        "successfully authenticated "
                        f"as {success_event['user']} "
                        f"after {len(prior_failures)} "
                        "failed attempts."
                    ),
                    confidence=95,
                    source_ip=success_event["ip"],
                    affected_users=[
                        success_event["user"]
                    ],
                    event_count=(
                        len(prior_failures) + 1
                    ),
                    recommendations=[
                        "Immediately investigate the successful session.",
                        "Disable or reset the affected account.",
                        "Review commands and activity performed after login.",
                        "Block the source IP pending investigation.",
                    ],
                )
            )

    # Rule 5: Invalid-user probing
    invalid_user_events = [
        event
        for event in failed_events
        if event["invalid_user"]
    ]

    invalid_users_by_ip: defaultdict[
        str,
        set[str],
    ] = defaultdict(set)

    for event in invalid_user_events:
        invalid_users_by_ip[
            event["ip"]
        ].add(event["user"])

    for ip, invalid_users in (
        invalid_users_by_ip.items()
    ):
        if (
            len(invalid_users)
            >= invalid_user_threshold
        ):
            event_count = sum(
                1
                for event in invalid_user_events
                if event["ip"] == ip
            )

            detections.append(
                create_detection(
                    detection_type=(
                        "Invalid User Probing"
                    ),
                    severity="Medium",
                    mitre_id="T1110.001",
                    description=(
                        f"{ip} attempted "
                        "authentication using "
                        f"{len(invalid_users)} "
                        "nonexistent usernames. "
                        "The configured threshold is "
                        f"{invalid_user_threshold} "
                        "usernames."
                    ),
                    confidence=min(
                        90,
                        65
                        + len(invalid_users) * 5,
                    ),
                    source_ip=ip,
                    affected_users=sorted(
                        invalid_users
                    ),
                    event_count=event_count,
                    recommendations=[
                        "Monitor the source IP for account enumeration activity.",
                        "Review SSH exposure and access-control restrictions.",
                        "Consider rate limiting repeated authentication failures.",
                    ],
                )
            )

    severity_order = {
        "Critical": 4,
        "High": 3,
        "Medium": 2,
        "Low": 1,
    }

    detections.sort(
        key=lambda detection: (
            severity_order.get(
                detection["severity"],
                0,
            ),
            detection.get(
                "confidence",
                0,
            ),
        ),
        reverse=True,
    )

    timeline.sort(
        key=lambda event: event[
            "line_number"
        ],
    )

    severity_summary = {
        "critical": sum(
            detection["severity"]
            == "Critical"
            for detection in detections
        ),
        "high": sum(
            detection["severity"] == "High"
            for detection in detections
        ),
        "medium": sum(
            detection["severity"]
            == "Medium"
            for detection in detections
        ),
        "low": sum(
            detection["severity"] == "Low"
            for detection in detections
        ),
    }

    risk_score, risk_level = calculate_risk_score(
        detections=detections,
        failed_logins=len(failed_events),
        successful_logins=len(
            successful_events
        ),
        risk_weights=risk_weights,
    )

    return {
        "filename": (
            original_filename
            or path.name
        ),
        "entries": len(lines),
        "preview": lines[:5],
        "failed_logins": len(
            failed_events
        ),
        "successful_logins": len(
            successful_events
        ),
        "suspicious_ips": suspicious_ips,
        "detections": detections,
        "severity_summary": severity_summary,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "timeline": timeline,
        "applied_settings": {
            "brute_force_threshold": (
                brute_force_threshold
            ),
            "password_spraying_threshold": (
                password_spraying_threshold
            ),
            "invalid_user_threshold": (
                invalid_user_threshold
            ),
            "privileged_accounts": sorted(
                privileged_accounts
            ),
            "risk_weights": {
                "critical": risk_weights[
                    "Critical"
                ],
                "high": risk_weights["High"],
                "medium": risk_weights[
                    "Medium"
                ],
                "low": risk_weights["Low"],
            },
        },
    }
    