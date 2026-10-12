import uuid
import logging
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import engine, Base, SessionLocal
import models
from auth import hash_password, verify_password, create_access_token, get_current_user_id

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("minipaas")

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

VALID_STATUSES = {"queued", "building", "running", "failed"}


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class DeploymentCreate(BaseModel):
    repo_url: str


class StatusUpdate(BaseModel):
    status: str


class UserRegister(BaseModel):
    email: str
    username: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


@app.get("/")
def read_root():
    return {"status": "API is alive"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


# ---------- Auth endpoints (public, no token required) ----------

@app.post("/auth/register")
def register(payload: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = models.User(
        email=payload.email,
        username=payload.username,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info(f"Registered new user {user.id} ({user.email})")
    return {"id": str(user.id), "email": user.email, "username": user.username}


@app.post("/auth/login")
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(str(user.id))
    logger.info(f"User {user.id} logged in")
    return {"access_token": token, "token_type": "bearer"}


# ---------- Deployment endpoints (protected — require a valid JWT) ----------

@app.post("/deployments")
def create_deployment(
    payload: DeploymentCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    deployment = models.Deployment(repo_url=payload.repo_url)
    db.add(deployment)
    db.commit()
    db.refresh(deployment)
    logger.info(f"Created deployment {deployment.id} for {deployment.repo_url}")
    return deployment


@app.get("/deployments")
def list_deployments(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    return db.query(models.Deployment).offset(skip).limit(limit).all()


@app.get("/deployments/{deployment_id}")
def get_deployment(
    deployment_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    deployment = db.query(models.Deployment).filter(models.Deployment.id == deployment_id).first()
    if deployment is None:
        raise HTTPException(status_code=404, detail="Deployment not found")
    return deployment


@app.delete("/deployments/{deployment_id}")
def delete_deployment(
    deployment_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    deployment = db.query(models.Deployment).filter(models.Deployment.id == deployment_id).first()
    if deployment is None:
        raise HTTPException(status_code=404, detail="Deployment not found")
    db.delete(deployment)
    db.commit()
    return {"message": "Deployment deleted"}


@app.patch("/deployments/{deployment_id}/status")
def update_status(
    deployment_id: uuid.UUID,
    body: StatusUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    status = body.status
    if status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{status}'. Must be one of: {', '.join(VALID_STATUSES)}"
        )
    deployment = db.query(models.Deployment).filter(models.Deployment.id == deployment_id).first()
    if deployment is None:
        raise HTTPException(status_code=404, detail="Deployment not found")
    deployment.status = status
    db.commit()
    db.refresh(deployment)
    logger.info(f"Deployment {deployment.id} status changed to {status}")
    return deployment