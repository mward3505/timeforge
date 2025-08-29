# app/routers.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .database import SessionLocal
from . import models, schemas

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/activities", response_model=list[schemas.ActivityOut])
def list_activities(db: Session = Depends(get_db)):
    return db.query(models.Activity).all()

@router.post("/activities", response_model=schemas.ActivityOut)
def create_activity(payload: schemas.ActivityCreate, db: Session = Depends(get_db)):
    a = models.Activity(**payload.dict())
    db.add(a)
    db.commit()
    db.refresh(a)
    return a
