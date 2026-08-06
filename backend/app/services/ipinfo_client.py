from __future__ import annotations

import ipaddress
import os
from dataclasses import dataclass
from typing import Any

import httpx
from dotenv import load_dotenv


load_dotenv()


IPINFO_BASE_URL = "https://api.ipinfo.io/lite"
IPINFO_TIMEOUT_SECONDS = 10.0


class IPInfoConfigurationError(RuntimeError):
    """Raised when the IPinfo integration is not configured correctly."""


class IPInfoRequestError(RuntimeError):
    """Raised when IPinfo cannot complete a lookup."""


@dataclass(frozen=True)
class IPInfoResult:
    ip: str
    country_code: str | None
    country: str | None
    continent_code: str | None
    continent: str | None
    asn: str | None
    organization: str | None
    organization_domain: str | None
    source: str = "IPinfo Lite"

    def to_dict(self) -> dict[str, Any]:
        return {
            "ip": self.ip,
            "country_code": self.country_code,
            "country": self.country,
            "continent_code": self.continent_code,
            "continent": self.continent,
            "asn": self.asn,
            "organization": self.organization,
            "organization_domain": self.organization_domain,
            "source": self.source,
        }


def get_ipinfo_token() -> str:
    token = os.getenv("IPINFO_API_TOKEN", "").strip()

    if not token:
        raise IPInfoConfigurationError(
            "IPINFO_API_TOKEN is missing. Add it to backend/.env."
        )

    return token


def validate_ip_address(ip_address: str) -> str:
    cleaned_ip = ip_address.strip()

    if not cleaned_ip:
        raise ValueError("An IP address is required.")

    try:
        parsed_ip = ipaddress.ip_address(cleaned_ip)
    except ValueError as error:
        raise ValueError(f"Invalid IP address: {cleaned_ip}") from error

    return str(parsed_ip)


def is_public_ip(ip_address: str) -> bool:
    parsed_ip = ipaddress.ip_address(ip_address)

    return not any(
        (
            parsed_ip.is_private,
            parsed_ip.is_loopback,
            parsed_ip.is_link_local,
            parsed_ip.is_multicast,
            parsed_ip.is_reserved,
            parsed_ip.is_unspecified,
        )
    )


def normalize_ipinfo_response(
    ip_address: str,
    payload: dict[str, Any],
) -> IPInfoResult:
    return IPInfoResult(
        ip=str(payload.get("ip") or ip_address),
        country_code=_optional_string(payload.get("country_code")),
        country=_optional_string(payload.get("country")),
        continent_code=_optional_string(payload.get("continent_code")),
        continent=_optional_string(payload.get("continent")),
        asn=_optional_string(payload.get("asn")),
        organization=_optional_string(payload.get("as_name")),
        organization_domain=_optional_string(payload.get("as_domain")),
    )


async def lookup_ip(ip_address: str) -> IPInfoResult:
    validated_ip = validate_ip_address(ip_address)

    if not is_public_ip(validated_ip):
        raise ValueError(
            "Threat-intelligence enrichment is available only for public IP addresses."
        )

    token = get_ipinfo_token()

    url = f"{IPINFO_BASE_URL}/{validated_ip}"

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "User-Agent": "SentinelAI/1.0",
    }

    try:
        async with httpx.AsyncClient(
            timeout=IPINFO_TIMEOUT_SECONDS,
            follow_redirects=True,
        ) as client:
            response = await client.get(
                url,
                headers=headers,
            )
    except httpx.TimeoutException as error:
        raise IPInfoRequestError(
            "The IPinfo request timed out."
        ) from error
    except httpx.RequestError as error:
        raise IPInfoRequestError(
            "SentinelAI could not connect to IPinfo."
        ) from error

    if response.status_code == 401:
        raise IPInfoConfigurationError(
            "IPinfo rejected the API token. Check IPINFO_API_TOKEN in backend/.env."
        )

    if response.status_code == 403:
        raise IPInfoRequestError(
            "The IPinfo account does not have permission to access this resource."
        )

    if response.status_code == 404:
        raise IPInfoRequestError(
            f"IPinfo did not find information for {validated_ip}."
        )

    if response.status_code == 429:
        raise IPInfoRequestError(
            "The IPinfo request limit has been reached. Try again later."
        )

    if response.status_code >= 400:
        raise IPInfoRequestError(
            f"IPinfo returned HTTP {response.status_code}."
        )

    try:
        payload = response.json()
    except ValueError as error:
        raise IPInfoRequestError(
            "IPinfo returned an invalid JSON response."
        ) from error

    if not isinstance(payload, dict):
        raise IPInfoRequestError(
            "IPinfo returned an unexpected response format."
        )

    return normalize_ipinfo_response(
        validated_ip,
        payload,
    )


def _optional_string(value: Any) -> str | None:
    if value is None:
        return None

    normalized_value = str(value).strip()

    return normalized_value or None
    