from datetime import datetime
from pathlib import Path
from typing import List, Optional

from fastapi import (
    FastAPI,
    Depends,
    UploadFile,
    File,
    HTTPException,
)

from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from pydantic import BaseModel, Field

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


# =====================================================
# APP INITIALIZATION
# =====================================================

app = FastAPI(
    title="SentinelAI API",
    description="AI assisted SOC investigation platform",
    version="1.0.0",
)


# =====================================================
# CORS CONFIGURATION
# =====================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",

        # Production frontend
        # Update after Vercel deployment
        "https://sentinelai.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================================================
# DATABASE INITIALIZATION
# =====================================================

Base.metadata.create_all(bind=engine)


# =====================================================
# ROUTERS
# =====================================================

app.include_router(
    threat_router,
    prefix="/api/threat-intel",
    tags=["Threat Intelligence"],
)


# =====================================================
# STORAGE
# =====================================================

UPLOAD_DIR = Path("temp_uploads")

UPLOAD_DIR.mkdir(
    exist_ok=True
)


# =====================================================
# PYDANTIC MODELS
# =====================================================


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



class AnalysisResponse(BaseModel):

    id: int

    filename: str

    created_at: datetime

    total_events: int

    failed_logins: int

    suspicious_ips: List[str]

    risk_score: int

    severity: str
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from fastapi import (
    FastAPI,
    Depends,
    UploadFile,
    File,
    HTTPException,
)

from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from pydantic import BaseModel, Field

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


# =====================================================
# APP INITIALIZATION
# =====================================================

app = FastAPI(
    title="SentinelAI API",
    description="AI assisted SOC investigation platform",
    version="1.0.0",
)


# =====================================================
# CORS CONFIGURATION
# =====================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",

        # Production frontend
        # Update after Vercel deployment
        "https://sentinelai.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================================================
# DATABASE INITIALIZATION
# =====================================================

Base.metadata.create_all(bind=engine)


# =====================================================
# ROUTERS
# =====================================================

app.include_router(
    threat_router,
    prefix="/api/threat-intel",
    tags=["Threat Intelligence"],
)


# =====================================================
# STORAGE
# =====================================================

UPLOAD_DIR = Path("temp_uploads")

UPLOAD_DIR.mkdir(
    exist_ok=True
)


# =====================================================
# PYDANTIC MODELS
# =====================================================


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



class AnalysisResponse(BaseModel):

    id: int

    filename: str

    created_at: datetime

    total_events: int

    failed_logins: int

    suspicious_ips: List[str]

    risk_score: int

    severity: str

# =====================================================
# ANALYSIS ROUTES
# =====================================================


@app.get("/api/analyses")
def get_analyses(
    db: Session = Depends(get_db)
):

    analyses = (
        db.query(Analysis)
        .order_by(
            Analysis.created_at.desc()
        )
        .all()
    )


    return [

        serialize_analysis(
            analysis
        )

        for analysis in analyses

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


    if analysis is None:

        raise HTTPException(

            status_code=404,

            detail="Analysis not found"

        )


    return serialize_analysis(
        analysis
    )





@app.delete("/api/analyses/{analysis_id}")
def delete_analysis(
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


    if analysis is None:

        raise HTTPException(

            status_code=404,

            detail="Analysis not found"

        )


    db.delete(
        analysis
    )


    db.commit()


    return {

        "message":
        "Analysis deleted successfully",

        "id":
        analysis_id

    }





# =====================================================
# INVESTIGATION ROUTES
# =====================================================



@app.get("/api/investigations")
def get_investigations(
    db: Session = Depends(get_db)

):


    investigations = (

        db.query(Investigation)

        .order_by(
            Investigation.created_at.desc()
        )

        .all()

    )


    return [

        serialize_investigation(
            investigation
        )

        for investigation in investigations

    ]







@app.post("/api/investigations")
def create_investigation(
    payload: InvestigationCreate,

    db: Session = Depends(get_db)

):


    analysis = (

        db.query(Analysis)

        .filter(
            Analysis.id == payload.analysis_id
        )

        .first()

    )


    if analysis is None:

        raise HTTPException(

            status_code=404,

            detail="Analysis not found"

        )



    investigation = Investigation(

        analysis_id=payload.analysis_id,

        title=payload.title,

        severity=payload.severity,

        status="Open",

        analyst=payload.analyst,

        notes=payload.notes,

        created_at=datetime.utcnow(),

        updated_at=datetime.utcnow()

    )


    db.add(
        investigation
    )


    db.commit()


    db.refresh(
        investigation
    )


    return serialize_investigation(
        investigation
    )







@app.put("/api/investigations/{investigation_id}")
def update_investigation(

    investigation_id: int,

    payload: InvestigationUpdate,

    db: Session = Depends(get_db)

):


    investigation = (

        db.query(Investigation)

        .filter(

            Investigation.id
            ==
            investigation_id

        )

        .first()

    )


    if investigation is None:

        raise HTTPException(

            status_code=404,

            detail="Investigation not found"

        )





    if payload.status:

        investigation.status = payload.status



    if payload.analyst:

        investigation.analyst = payload.analyst



    if payload.notes:

        investigation.notes = payload.notes




    investigation.updated_at = datetime.utcnow()



    db.commit()



    db.refresh(
        investigation
    )


    return serialize_investigation(
        investigation
    )
    # =====================================================
# ANALYSIS ROUTES
# =====================================================


@app.get("/api/analyses")
def get_analyses(
    db: Session = Depends(get_db)
):

    analyses = (
        db.query(Analysis)
        .order_by(
            Analysis.created_at.desc()
        )
        .all()
    )


    return [

        serialize_analysis(
            analysis
        )

        for analysis in analyses

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


    if analysis is None:

        raise HTTPException(

            status_code=404,

            detail="Analysis not found"

        )


    return serialize_analysis(
        analysis
    )





@app.delete("/api/analyses/{analysis_id}")
def delete_analysis(
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


    if analysis is None:

        raise HTTPException(

            status_code=404,

            detail="Analysis not found"

        )


    db.delete(
        analysis
    )


    db.commit()


    return {

        "message":
        "Analysis deleted successfully",

        "id":
        analysis_id

    }





# =====================================================
# INVESTIGATION ROUTES
# =====================================================



@app.get("/api/investigations")
def get_investigations(
    db: Session = Depends(get_db)

):


    investigations = (

        db.query(Investigation)

        .order_by(
            Investigation.created_at.desc()
        )

        .all()

    )


    return [

        serialize_investigation(
            investigation
        )

        for investigation in investigations

    ]







@app.post("/api/investigations")
def create_investigation(
    payload: InvestigationCreate,

    db: Session = Depends(get_db)

):


    analysis = (

        db.query(Analysis)

        .filter(
            Analysis.id == payload.analysis_id
        )

        .first()

    )


    if analysis is None:

        raise HTTPException(

            status_code=404,

            detail="Analysis not found"

        )



    investigation = Investigation(

        analysis_id=payload.analysis_id,

        title=payload.title,

        severity=payload.severity,

        status="Open",

        analyst=payload.analyst,

        notes=payload.notes,

        created_at=datetime.utcnow(),

        updated_at=datetime.utcnow()

    )


    db.add(
        investigation
    )


    db.commit()


    db.refresh(
        investigation
    )


    return serialize_investigation(
        investigation
    )







@app.put("/api/investigations/{investigation_id}")
def update_investigation(

    investigation_id: int,

    payload: InvestigationUpdate,

    db: Session = Depends(get_db)

):


    investigation = (

        db.query(Investigation)

        .filter(

            Investigation.id
            ==
            investigation_id

        )

        .first()

    )


    if investigation is None:

        raise HTTPException(

            status_code=404,

            detail="Investigation not found"

        )





    if payload.status:

        investigation.status = payload.status



    if payload.analyst:

        investigation.analyst = payload.analyst



    if payload.notes:

        investigation.notes = payload.notes




    investigation.updated_at = datetime.utcnow()



    db.commit()



    db.refresh(
        investigation
    )


    return serialize_investigation(
        investigation
    )
    


