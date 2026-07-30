from datetime import datetime, timezone
from json import JSONDecodeError, loads
from pathlib import Path
from typing import Any, Literal
from uuid import uuid4

from fastapi import (
    FastAPI,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from app.database import (
    Analysis,
    Detection,
    Investigation,
    SessionLocal,
    TimelineEvent,
    create_database,
    engine,
)
from app.log_parser import parse_log


app = FastAPI(
    title="SentinelAI API",
    description=(
        "Backend API for security log analysis, persistent "
        "investigations, and SOC history."
    ),
    version="0.6.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


InvestigationStatus = Literal[
    "Open",
    "In Progress",
    "Resolved",
    "False Positive",
]


class InvestigationCreate(BaseModel):
    analysis_id: int
    detection_id: int
    status: InvestigationStatus = "Open"
    analyst: str = Field(
        default="Dipan",
        min_length=1,
        max_length=100,
    )
    notes: str = Field(
        default="",
        max_length=10000,
    )
    completed_actions: list[str] = Field(
        default_factory=list,
    )


class InvestigationUpdate(BaseModel):
    status: InvestigationStatus
    analyst: str = Field(
        default="Dipan",
        min_length=1,
        max_length=100,
    )
    notes: str = Field(
        default="",
        max_length=10000,
    )
    completed_actions: list[str] = Field(
        default_factory=list,
    )


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def migrate_investigation_table() -> None:
    """
    Adds investigation columns that may be missing from an older
    SentinelAI SQLite database.

    SQLAlchemy create_all() creates new tables, but it does not add
    new columns to tables that already exist.
    """

    database_inspector = inspect(engine)

    if "investigations" not in database_inspector.get_table_names():
        return

    existing_columns = {
        column["name"]
        for column in database_inspector.get_columns(
            "investigations",
        )
    }

    migration_statements: list[str] = []

    if "detection_id" not in existing_columns:
        migration_statements.append(
            """
            ALTER TABLE investigations
            ADD COLUMN detection_id INTEGER
            """
        )

    if "completed_actions" not in existing_columns:
        migration_statements.append(
            """
            ALTER TABLE investigations
            ADD COLUMN completed_actions JSON DEFAULT '[]'
            """
        )

    if "updated_at" not in existing_columns:
        migration_statements.append(
            """
            ALTER TABLE investigations
            ADD COLUMN updated_at DATETIME
            """
        )

    if not migration_statements:
        return

    with engine.begin() as connection:
        for statement in migration_statements:
            connection.execute(text(statement))

        connection.execute(
            text(
                """
                UPDATE investigations
                SET completed_actions = '[]'
                WHERE completed_actions IS NULL
                """
            )
        )

        connection.execute(
            text(
                """
                UPDATE investigations
                SET updated_at = created_at
                WHERE updated_at IS NULL
                """
            )
        )


@app.on_event("startup")
def startup_event() -> None:
    create_database()
    migrate_investigation_table()


@app.get("/")
def root() -> dict[str, str]:
    return {
        "message": "SentinelAI API is running",
        "status": "healthy",
        "version": "0.6.0",
    }


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {
        "service": "SentinelAI API",
        "status": "healthy",
        "database": "connected",
        "timeline_persistence": "enabled",
        "investigation_persistence": "enabled",
        "version": "0.6.0",
    }


def parse_settings(
    settings_json: str | None,
) -> dict[str, Any] | None:
    if not settings_json:
        return None

    try:
        parsed_settings = loads(settings_json)
    except JSONDecodeError as error:
        raise HTTPException(
            status_code=400,
            detail="The detection settings are not valid JSON.",
        ) from error

    if not isinstance(parsed_settings, dict):
        raise HTTPException(
            status_code=400,
            detail="Detection settings must be a JSON object.",
        )

    return parsed_settings


def serialize_detection(
    detection: Detection,
) -> dict[str, Any]:
    return {
        "id": detection.id,
        "type": detection.type,
        "severity": detection.severity,
        "mitre_id": detection.mitre_id,
        "description": detection.description,
        "confidence": detection.confidence,
        "source_ip": detection.source_ip,
        "affected_users": detection.affected_users or [],
        "event_count": detection.event_count,
        "recommendations": detection.recommendations or [],
    }


def serialize_timeline_event(
    event: TimelineEvent,
) -> dict[str, Any]:
    return {
        "id": event.id,
        "line_number": event.line_number,
        "timestamp": event.timestamp,
        "event_type": event.event_type,
        "status": event.status,
        "title": event.title,
        "ip": event.ip,
        "user": event.user,
        "method": event.method,
        "raw": event.raw,
        "invalid_user": event.invalid_user,
    }


def serialize_investigation(
    investigation: Investigation,
) -> dict[str, Any]:
    return {
        "id": investigation.id,
        "analysis_id": investigation.analysis_id,
        "detection_id": investigation.detection_id,
        "status": investigation.status,
        "analyst": investigation.analyst,
        "notes": investigation.notes or "",
        "completed_actions": (
            investigation.completed_actions or []
        ),
        "created_at": (
            investigation.created_at.isoformat()
            if investigation.created_at
            else None
        ),
        "updated_at": (
            investigation.updated_at.isoformat()
            if investigation.updated_at
            else None
        ),
    }


def validate_analysis_and_detection(
    database: Session,
    analysis_id: int,
    detection_id: int,
) -> tuple[Analysis, Detection]:
    analysis = (
        database.query(Analysis)
        .filter(Analysis.id == analysis_id)
        .first()
    )

    if analysis is None:
        raise HTTPException(
            status_code=404,
            detail="Analysis not found.",
        )

    detection = (
        database.query(Detection)
        .filter(
            Detection.id == detection_id,
            Detection.analysis_id == analysis_id,
        )
        .first()
    )

    if detection is None:
        raise HTTPException(
            status_code=404,
            detail=(
                "Detection not found or it does not belong "
                "to this analysis."
            ),
        )

    return analysis, detection


def save_analysis_to_database(
    result: dict[str, Any],
) -> int:
    database: Session = SessionLocal()

    try:
        analysis_record = Analysis(
            filename=result.get(
                "filename",
                "unknown_file",
            ),
            total_entries=result.get(
                "entries",
                0,
            ),
            failed_logins=result.get(
                "failed_logins",
                0,
            ),
            successful_logins=result.get(
                "successful_logins",
                0,
            ),
            risk_score=result.get(
                "risk_score",
                0,
            ),
            risk_level=result.get(
                "risk_level",
                "Low",
            ),
        )

        database.add(analysis_record)
        database.flush()

        result_detections = result.get(
            "detections",
            [],
        )

        for detection_data in result_detections:
            detection_record = Detection(
                analysis_id=analysis_record.id,
                type=detection_data.get(
                    "type",
                    "Unknown Detection",
                ),
                severity=detection_data.get(
                    "severity",
                    "Low",
                ),
                mitre_id=detection_data.get(
                    "mitre_id",
                    "Unknown",
                ),
                description=detection_data.get(
                    "description",
                    "",
                ),
                confidence=detection_data.get(
                    "confidence",
                    0,
                ),
                source_ip=detection_data.get(
                    "source_ip",
                ),
                affected_users=detection_data.get(
                    "affected_users",
                    [],
                ),
                event_count=detection_data.get(
                    "event_count",
                    0,
                ),
                recommendations=detection_data.get(
                    "recommendations",
                    [],
                ),
            )

            database.add(detection_record)
            database.flush()

            # Return the SQLite detection ID to the frontend.
            detection_data["id"] = detection_record.id

        result_timeline = result.get(
            "timeline",
            [],
        )

        for event_data in result_timeline:
            timeline_record = TimelineEvent(
                analysis_id=analysis_record.id,
                line_number=event_data.get(
                    "line_number",
                    0,
                ),
                timestamp=event_data.get(
                    "timestamp",
                    "Unknown time",
                ),
                event_type=event_data.get(
                    "event_type",
                    "other",
                ),
                status=event_data.get(
                    "status",
                    "Informational",
                ),
                title=event_data.get(
                    "title",
                    "Authentication log event",
                ),
                ip=event_data.get("ip"),
                user=event_data.get("user"),
                method=event_data.get("method"),
                raw=event_data.get(
                    "raw",
                    "",
                ),
                invalid_user=bool(
                    event_data.get(
                        "invalid_user",
                        False,
                    )
                ),
            )

            database.add(timeline_record)
            database.flush()

            event_data["id"] = timeline_record.id

        database.commit()
        database.refresh(analysis_record)

        return analysis_record.id

    except Exception:
        database.rollback()
        raise

    finally:
        database.close()


@app.post("/api/upload")
async def upload_log(
    file: UploadFile = File(...),
    settings: str | None = Form(default=None),
) -> dict[str, Any]:
    allowed_extensions = {
        ".log",
        ".txt",
        ".csv",
        ".json",
    }

    original_filename = file.filename or "uploaded_file"
    safe_filename = Path(original_filename).name
    extension = Path(safe_filename).suffix.lower()

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported file type. Upload a LOG, TXT, "
                "CSV, or JSON file."
            ),
        )

    detection_settings = parse_settings(settings)

    temporary_directory = Path("temp_uploads")
    temporary_directory.mkdir(
        parents=True,
        exist_ok=True,
    )

    temporary_filename = (
        f"temp_{uuid4().hex}_{safe_filename}"
    )

    temporary_path = (
        temporary_directory / temporary_filename
    )

    try:
        contents = await file.read()

        if not contents:
            raise HTTPException(
                status_code=400,
                detail="The uploaded file is empty.",
            )

        temporary_path.write_bytes(contents)

        result = parse_log(
            file_path=str(temporary_path),
            original_filename=safe_filename,
            settings=detection_settings,
        )

        if "error" in result:
            raise HTTPException(
                status_code=400,
                detail=str(result["error"]),
            )

        analysis_id = save_analysis_to_database(
            result,
        )

        result["analysis_id"] = analysis_id
        result["saved_to_database"] = True

        return result

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "SentinelAI could not process or save "
                "the uploaded file."
            ),
        ) from error

    finally:
        temporary_path.unlink(
            missing_ok=True,
        )

        await file.close()


@app.get("/api/analyses")
def get_analyses() -> list[dict[str, Any]]:
    database: Session = SessionLocal()

    try:
        analyses = (
            database.query(Analysis)
            .order_by(
                Analysis.upload_time.desc(),
            )
            .all()
        )

        return [
            {
                "id": analysis.id,
                "filename": analysis.filename,
                "upload_time": (
                    analysis.upload_time.isoformat()
                    if analysis.upload_time
                    else None
                ),
                "entries": analysis.total_entries,
                "failed_logins": analysis.failed_logins,
                "successful_logins": (
                    analysis.successful_logins
                ),
                "risk_score": analysis.risk_score,
                "risk_level": analysis.risk_level,
                "detection_count": len(
                    analysis.detections,
                ),
                "timeline_event_count": len(
                    analysis.timeline_events,
                ),
                "investigation_count": len(
                    analysis.investigations,
                ),
            }
            for analysis in analyses
        ]

    finally:
        database.close()


@app.get("/api/analyses/{analysis_id}")
def get_analysis(
    analysis_id: int,
) -> dict[str, Any]:
    database: Session = SessionLocal()

    try:
        analysis = (
            database.query(Analysis)
            .filter(
                Analysis.id == analysis_id,
            )
            .first()
        )

        if analysis is None:
            raise HTTPException(
                status_code=404,
                detail="Analysis not found.",
            )

        timeline = sorted(
            analysis.timeline_events,
            key=lambda event: event.line_number,
        )

        return {
            "id": analysis.id,
            "filename": analysis.filename,
            "upload_time": (
                analysis.upload_time.isoformat()
                if analysis.upload_time
                else None
            ),
            "entries": analysis.total_entries,
            "failed_logins": analysis.failed_logins,
            "successful_logins": (
                analysis.successful_logins
            ),
            "risk_score": analysis.risk_score,
            "risk_level": analysis.risk_level,
            "detections": [
                serialize_detection(detection)
                for detection in analysis.detections
            ],
            "timeline": [
                serialize_timeline_event(event)
                for event in timeline
            ],
        }

    finally:
        database.close()


@app.delete("/api/analyses/{analysis_id}")
def delete_analysis(
    analysis_id: int,
) -> dict[str, Any]:
    database: Session = SessionLocal()

    try:
        analysis = (
            database.query(Analysis)
            .filter(
                Analysis.id == analysis_id,
            )
            .first()
        )

        if analysis is None:
            raise HTTPException(
                status_code=404,
                detail="Analysis not found.",
            )

        filename = analysis.filename

        database.delete(analysis)
        database.commit()

        return {
            "message": "Analysis deleted successfully.",
            "analysis_id": analysis_id,
            "filename": filename,
        }

    except HTTPException:
        database.rollback()
        raise

    except Exception as error:
        database.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "SentinelAI could not delete the analysis."
            ),
        ) from error

    finally:
        database.close()


@app.get("/api/investigations")
def get_investigations(
    analysis_id: int | None = None,
) -> list[dict[str, Any]]:
    database: Session = SessionLocal()

    try:
        query = database.query(Investigation)

        if analysis_id is not None:
            query = query.filter(
                Investigation.analysis_id == analysis_id,
            )

        investigations = (
            query.order_by(
                Investigation.updated_at.desc(),
                Investigation.created_at.desc(),
            )
            .all()
        )

        return [
            serialize_investigation(investigation)
            for investigation in investigations
        ]

    finally:
        database.close()


@app.get("/api/investigations/lookup")
def get_investigation_for_detection(
    analysis_id: int,
    detection_id: int,
) -> dict[str, Any] | None:
    database: Session = SessionLocal()

    try:
        validate_analysis_and_detection(
            database,
            analysis_id,
            detection_id,
        )

        investigation = (
            database.query(Investigation)
            .filter(
                Investigation.analysis_id == analysis_id,
                Investigation.detection_id == detection_id,
            )
            .order_by(
                Investigation.updated_at.desc(),
                Investigation.id.desc(),
            )
            .first()
        )

        if investigation is None:
            return None

        return serialize_investigation(
            investigation,
        )

    finally:
        database.close()


@app.post("/api/investigations")
def save_investigation(
    payload: InvestigationCreate,
) -> dict[str, Any]:
    database: Session = SessionLocal()

    try:
        validate_analysis_and_detection(
            database,
            payload.analysis_id,
            payload.detection_id,
        )

        investigation = (
            database.query(Investigation)
            .filter(
                Investigation.analysis_id
                == payload.analysis_id,
                Investigation.detection_id
                == payload.detection_id,
            )
            .first()
        )

        if investigation is None:
            investigation = Investigation(
                analysis_id=payload.analysis_id,
                detection_id=payload.detection_id,
                status=payload.status,
                analyst=payload.analyst.strip(),
                notes=payload.notes,
                completed_actions=payload.completed_actions,
                created_at=utc_now(),
                updated_at=utc_now(),
            )

            database.add(investigation)

        else:
            investigation.status = payload.status
            investigation.analyst = payload.analyst.strip()
            investigation.notes = payload.notes
            investigation.completed_actions = (
                payload.completed_actions
            )
            investigation.updated_at = utc_now()

        database.commit()
        database.refresh(investigation)

        return serialize_investigation(
            investigation,
        )

    except HTTPException:
        database.rollback()
        raise

    except Exception as error:
        database.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "SentinelAI could not save the investigation."
            ),
        ) from error

    finally:
        database.close()


@app.put("/api/investigations/{investigation_id}")
def update_investigation(
    investigation_id: int,
    payload: InvestigationUpdate,
) -> dict[str, Any]:
    database: Session = SessionLocal()

    try:
        investigation = (
            database.query(Investigation)
            .filter(
                Investigation.id == investigation_id,
            )
            .first()
        )

        if investigation is None:
            raise HTTPException(
                status_code=404,
                detail="Investigation not found.",
            )

        investigation.status = payload.status
        investigation.analyst = payload.analyst.strip()
        investigation.notes = payload.notes
        investigation.completed_actions = (
            payload.completed_actions
        )
        investigation.updated_at = utc_now()

        database.commit()
        database.refresh(investigation)

        return serialize_investigation(
            investigation,
        )

    except HTTPException:
        database.rollback()
        raise

    except Exception as error:
        database.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "SentinelAI could not update the investigation."
            ),
        ) from error

    finally:
        database.close()
        