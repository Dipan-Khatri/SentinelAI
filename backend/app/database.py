from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    create_engine,
)
from sqlalchemy.orm import (
    declarative_base,
    relationship,
    sessionmaker,
)


BASE_DIR = Path(__file__).resolve().parent.parent

DATABASE_PATH = BASE_DIR / "sentinelai.db"

DATABASE_URL = f"sqlite:///{DATABASE_PATH}"


engine = create_engine(
    DATABASE_URL,
    connect_args={
        "check_same_thread": False,
    },
)


SessionLocal = sessionmaker(
    autoflush=False,
    autocommit=False,
    bind=engine,
)


Base = declarative_base()


# ✅ THIS WAS MISSING
# FastAPI database session dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)

    filename = Column(String, nullable=False)

    upload_time = Column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )

    total_entries = Column(
        Integer,
        default=0,
        nullable=False,
    )

    failed_logins = Column(
        Integer,
        default=0,
        nullable=False,
    )

    successful_logins = Column(
        Integer,
        default=0,
        nullable=False,
    )

    risk_score = Column(
        Integer,
        default=0,
        nullable=False,
    )

    risk_level = Column(
        String,
        default="Low",
        nullable=False,
    )

    detections = relationship(
        "Detection",
        back_populates="analysis",
        cascade="all, delete-orphan",
    )

    timeline_events = relationship(
        "TimelineEvent",
        back_populates="analysis",
        cascade="all, delete-orphan",
        order_by="TimelineEvent.line_number",
    )

    investigations = relationship(
        "Investigation",
        back_populates="analysis",
        cascade="all, delete-orphan",
    )


class Detection(Base):
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, index=True)

    analysis_id = Column(
        Integer,
        ForeignKey("analyses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    type = Column(String, nullable=False)

    severity = Column(
        String,
        default="Low",
        nullable=False,
    )

    mitre_id = Column(
        String,
        default="Unknown",
        nullable=False,
    )

    description = Column(
        Text,
        default="",
        nullable=False,
    )

    confidence = Column(
        Float,
        default=0,
        nullable=False,
    )

    source_ip = Column(
        String,
        nullable=True,
    )

    affected_users = Column(
        JSON,
        default=list,
        nullable=False,
    )

    event_count = Column(
        Integer,
        default=0,
        nullable=False,
    )

    recommendations = Column(
        JSON,
        default=list,
        nullable=False,
    )

    analysis = relationship(
        "Analysis",
        back_populates="detections",
    )


class TimelineEvent(Base):
    __tablename__ = "timeline_events"

    id = Column(Integer, primary_key=True, index=True)

    analysis_id = Column(
        Integer,
        ForeignKey("analyses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    line_number = Column(
        Float,
        default=0,
        nullable=False,
    )

    timestamp = Column(
        String,
        default="Unknown time",
        nullable=False,
    )

    event_type = Column(
        String,
        default="other",
        nullable=False,
    )

    status = Column(
        String,
        default="Informational",
        nullable=False,
    )

    title = Column(
        String,
        default="Authentication log event",
        nullable=False,
    )

    ip = Column(
        String,
        nullable=True,
    )

    user = Column(
        String,
        nullable=True,
    )

    method = Column(
        String,
        nullable=True,
    )

    raw = Column(
        Text,
        default="",
        nullable=False,
    )

    invalid_user = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    analysis = relationship(
        "Analysis",
        back_populates="timeline_events",
    )


class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(Integer, primary_key=True, index=True)

    analysis_id = Column(
        Integer,
        ForeignKey("analyses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    detection_id = Column(
        Integer,
        ForeignKey("detections.id", ondelete="SET NULL"),
        nullable=True,
    )

    status = Column(
        String,
        default="Open",
        nullable=False,
    )

    analyst = Column(
        String,
        default="Dipan",
        nullable=False,
    )

    notes = Column(
        Text,
        default="",
        nullable=False,
    )

    completed_actions = Column(
        JSON,
        default=list,
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )

    updated_at = Column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        nullable=False,
    )

    analysis = relationship(
        "Analysis",
        back_populates="investigations",
    )


def create_database() -> None:
    Base.metadata.create_all(bind=engine)
    