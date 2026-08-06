from __future__ import annotations

import time
from dataclasses import dataclass
from threading import Lock

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.services.ipinfo_client import (
    IPInfoConfigurationError,
    IPInfoRequestError,
    lookup_ip,
)


router = APIRouter(
    prefix="/api/threat-intel",
    tags=["Threat Intelligence"],
)

CACHE_TTL_SECONDS = 60 * 60


class ThreatIntelligenceResponse(BaseModel):
    ip: str = Field(
        ...,
        description="Public IPv4 or IPv6 address that was enriched.",
    )
    country_code: str | None = None
    country: str | None = None
    continent_code: str | None = None
    continent: str | None = None
    asn: str | None = None
    organization: str | None = None
    organization_domain: str | None = None
    source: str
    cached: bool
    recommendation: str


@dataclass
class CachedThreatIntelligence:
    response: ThreatIntelligenceResponse
    expires_at: float


_threat_intelligence_cache: dict[
    str,
    CachedThreatIntelligence,
] = {}

_cache_lock = Lock()


@router.get(
    "/{ip_address}",
    response_model=ThreatIntelligenceResponse,
    summary="Enrich a public IP address",
    description=(
        "Looks up geographic and network ownership information "
        "for a public IPv4 or IPv6 address using IPinfo Lite."
    ),
)
async def get_threat_intelligence(
    ip_address: str,
) -> ThreatIntelligenceResponse:
    cached_response = _get_cached_response(ip_address)

    if cached_response is not None:
        return cached_response

    try:
        result = await lookup_ip(ip_address)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error
    except IPInfoConfigurationError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(error),
        ) from error
    except IPInfoRequestError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(error),
        ) from error

    response = ThreatIntelligenceResponse(
        ip=result.ip,
        country_code=result.country_code,
        country=result.country,
        continent_code=result.continent_code,
        continent=result.continent,
        asn=result.asn,
        organization=result.organization,
        organization_domain=result.organization_domain,
        source=result.source,
        cached=False,
        recommendation=_build_recommendation(
            organization=result.organization,
            country=result.country,
        ),
    )

    _store_cached_response(
        ip_address=result.ip,
        response=response,
    )

    return response


@router.delete(
    "/cache",
    status_code=status.HTTP_200_OK,
    summary="Clear the threat-intelligence cache",
)
async def clear_threat_intelligence_cache() -> dict[str, int | str]:
    with _cache_lock:
        removed_entries = len(
            _threat_intelligence_cache,
        )
        _threat_intelligence_cache.clear()

    return {
        "message": "Threat-intelligence cache cleared.",
        "removed_entries": removed_entries,
    }


def _get_cached_response(
    ip_address: str,
) -> ThreatIntelligenceResponse | None:
    normalized_ip = ip_address.strip()

    with _cache_lock:
        cached_entry = _threat_intelligence_cache.get(
            normalized_ip,
        )

        if cached_entry is None:
            return None

        if cached_entry.expires_at <= time.time():
            del _threat_intelligence_cache[
                normalized_ip
            ]
            return None

        return cached_entry.response.model_copy(
            update={
                "cached": True,
            },
        )


def _store_cached_response(
    ip_address: str,
    response: ThreatIntelligenceResponse,
) -> None:
    with _cache_lock:
        _threat_intelligence_cache[ip_address] = (
            CachedThreatIntelligence(
                response=response,
                expires_at=(
                    time.time()
                    + CACHE_TTL_SECONDS
                ),
            )
        )


def _build_recommendation(
    organization: str | None,
    country: str | None,
) -> str:
    organization_name = (
        organization or "the identified network"
    )

    country_name = (
        country or "an unknown country"
    )

    return (
        f"Review activity from {organization_name} in "
        f"{country_name} and correlate it with authentication "
        "events before blocking the address. IPinfo ownership "
        "data alone does not prove malicious activity."
    )