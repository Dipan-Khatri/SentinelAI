from datetime import datetime
from pathlib import Path
from typing import List, Optional

from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    UploadFile,
    File,
)

from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import (
    Base,
    engine,
    get_db,
    Analysis,
    Investigation,
)

from app.log_parser import parse_log
from app.routers.threat_intel import router as threat_router


# ==============================
# APP
# ==============================

app = FastAPI(
    title="SentinelAI API",
    description="AI assisted SOC investigation platform",
    version="1.0.0",
)


# ==============================
# CORS
# ==============================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==============================
# DATABASE
# ==============================

Base.metadata.create_all(bind=engine)


# ==============================
# ROUTERS
# ==============================

app.include_router(
    threat_router,
    prefix="/api/threat-intel",
    tags=["Threat Intelligence"],
)


UPLOAD_DIR = Path("temp_uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


# ==============================
# MODELS
# ==============================


class InvestigationCreate(BaseModel):
    analysis_id: int
    title: str
    severity: str = "Medium"
    analyst: str = "SOC Analyst"
    notes: Optional[str] = None


class InvestigationUpdate(BaseModel):
    status: Optional[str] = None
    analyst: Optional[str] = None
    notes: Optional[str] = None



# ==============================
# HELPERS
# ==============================


def serialize_analysis(analysis):

    return {
        "id": analysis.id,
        "filename": analysis.filename,
        "created_at": analysis.upload_time,
        "total_events": analysis.total_entries,
        "failed_logins": analysis.failed_logins,
        "successful_logins": analysis.successful_logins,
        "risk_score": analysis.risk_score,
        "severity": analysis.risk_level,
        "detections": len(analysis.detections),
    }



def serialize_investigation(inv):

    return {
        "id": inv.id,
        "analysis_id": inv.analysis_id,
        "status": inv.status,
        "analyst": inv.analyst,
        "notes": inv.notes,
        "created_at": inv.created_at,
        "updated_at": inv.updated_at,
    }



# ==============================
# HEALTH CHECK
# ==============================


@app.get("/")
def root():

    return {
        "status": "running",
        "service": "SentinelAI API"
    }



# ==============================
# ANALYSIS
# ==============================


@app.get("/api/analyses")
def get_analyses(
    db: Session = Depends(get_db)
):

    results = (
        db.query(Analysis)
        .order_by(
            Analysis.id.desc()
        )
        .all()
    )


    return [
        serialize_analysis(x)
        for x in results
    ]




@app.get("/api/analyses/{analysis_id}")
def get_analysis(
    analysis_id: int,
    db: Session = Depends(get_db)
):

    analysis = (
        db.query(Analysis)
        .filter(
            Analysis.id == analysis_id
        )
        .first()
    )


    if not analysis:
        raise HTTPException(
            status_code=404,
            detail="Analysis not found"
        )


    return serialize_analysis(
        analysis
    )




@app.delete("/api/analyses/{analysis_id}")
def delete_analysis(
    analysis_id:int,
    db:Session=Depends(get_db)
):

    analysis = (
        db.query(Analysis)
        .filter(
            Analysis.id == analysis_id
        )
        .first()
    )


    if not analysis:
        raise HTTPException(
            status_code=404,
            detail="Not found"
        )


    db.delete(analysis)
    db.commit()


    return {
        "message":"Deleted"
    }



# ==============================
# INVESTIGATION
# ==============================


@app.get("/api/investigations")
def get_investigations(
    db:Session=Depends(get_db)
):

    data = (
        db.query(Investigation)
        .order_by(
            Investigation.id.desc()
        )
        .all()
    )


    return [
        serialize_investigation(x)
        for x in data
    ]




@app.post("/api/investigations")
def create_investigation(
    payload: InvestigationCreate,
    db:Session=Depends(get_db)
):

    analysis = (
        db.query(Analysis)
        .filter(
            Analysis.id == payload.analysis_id
        )
        .first()
    )


    if not analysis:
        raise HTTPException(
            status_code=404,
            detail="Analysis missing"
        )


    inv = Investigation(
        analysis_id=payload.analysis_id,
        status="Open",
        analyst=payload.analyst,
        notes=payload.notes or "",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


    db.add(inv)
    db.commit()
    db.refresh(inv)


    return serialize_investigation(inv)




@app.put("/api/investigations/{investigation_id}")
def update_investigation(
    investigation_id:int,
    payload:InvestigationUpdate,
    db:Session=Depends(get_db)
):

    inv = (
        db.query(Investigation)
        .filter(
            Investigation.id == investigation_id
        )
        .first()
    )


    if not inv:
        raise HTTPException(
            status_code=404,
            detail="Investigation not found"
        )


    if payload.status:
        inv.status = payload.status

    if payload.analyst:
        inv.analyst = payload.analyst

    if payload.notes:
        inv.notes = payload.notes


    inv.updated_at=datetime.utcnow()


    db.commit()
    db.refresh(inv)


    return serialize_investigation(inv)



# ==============================
# UPLOAD LOG
# ==============================


@app.post("/api/upload")
async def upload_log(
    file:UploadFile = File(...),
    db:Session=Depends(get_db)
):

    path = UPLOAD_DIR / file.filename


    with open(path,"wb") as f:
        f.write(
            await file.read()
        )


    result = parse_log(path)


    analysis = Analysis(
        filename=file.filename,
        total_entries=result.get(
            "total_entries",
            0
        ),
        failed_logins=result.get(
            "failed_logins",
            0
        ),
        successful_logins=result.get(
            "successful_logins",
            0
        ),
        risk_score=result.get(
            "risk_score",
            0
        ),
        risk_level=result.get(
            "risk_level",
            "Low"
        )
    )


    db.add(analysis)
    db.commit()
    db.refresh(analysis)


    return serialize_analysis(
        analysis
    )
    