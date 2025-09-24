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

@router.get("/availability", response_model=list[schemas.AvailabilityOut])
def list_availability(db: Session = Depends(get_db), user_id: int = 1):
    return (
        db.query(models.Availability)
        .filter_by(user_id=user_id)
        .order_by(models.Availability.day_of_week)
        .all()
    )

@router.post("/availability", response_model=list[schemas.AvailabilityOut])
def upsert_availability(
    payload: list[schemas.AvailabilityUpsert],
    db: Session = Depends(get_db),
    user_id: int = 1,
):
    # Get existing rows for this user
    existing = {
        a.day_of_week: a
        for a in db.query(models.Availability).filter_by(user_id=user_id).all()
    }

    result = []
    for item in payload:
        if item.day_of_week in existing:
            # Update existing row
            row = existing[item.day_of_week]
            row.available_minutes = item.available_minutes
        else:
            # Insert new row
            row = models.Availability(user_id=user_id, **item.dict())
            db.add(row)
        db.flush() # Prepare teh row for use before commit
        result.append(row)

    db.commit()
    return result