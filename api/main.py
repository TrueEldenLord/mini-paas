import uuid
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import engine, Base, SessionLocal
import models
import logging

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


@app.get("/")
def read_root():
    return {"status": "API is alive"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.post("/deployments")
def create_deployment(payload: DeploymentCreate, db: Session = Depends(get_db)):
    deployment = models.Deployment(repo_url=payload.repo_url)
    db.add(deployment)
    db.commit()
    db.refresh(deployment)
    logger.info(f"Created deployment {deployment.id} for {deployment.repo_url}")
    return deployment


@app.get("/deployments")
def list_deployments(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    return db.query(models.Deployment).offset(skip).limit(limit).all()


@app.get("/deployments/{deployment_id}")
def get_deployment(deployment_id: uuid.UUID, db: Session = Depends(get_db)):
    deployment = db.query(models.Deployment).filter(models.Deployment.id == deployment_id).first()
    if deployment is None:
        raise HTTPException(status_code=404, detail="Deployment not found")
    return deployment


@app.delete("/deployments/{deployment_id}")
def delete_deployment(deployment_id: uuid.UUID, db: Session = Depends(get_db)):
    deployment = db.query(models.Deployment).filter(models.Deployment.id == deployment_id).first()
    if deployment is None:
        raise HTTPException(status_code=404, detail="Deployment not found")
    db.delete(deployment)
    db.commit()
    return {"message": "Deployment deleted"}


@app.patch("/deployments/{deployment_id}/status")
def update_status(deployment_id: uuid.UUID, status: str, db: Session = Depends(get_db)):
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