# app/routers.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict

from .database import SessionLocal
from . import models, schemas
from .dependencies import get_current_user

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/availability", response_model=list[schemas.AvailabilityOut])
def list_availability(db: Session = Depends(get_db), current_user = Depends(get_current_user),):
    return (
        db.query(models.Availability)
        .filter_by(user_id=current_user.id)
        .order_by(models.Availability.day_of_week)
        .all()
    )

@router.post("/availability", response_model=list[schemas.AvailabilityOut])
def upsert_availability(
    payload: list[schemas.AvailabilityUpsert],
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    # Get existing rows for this user
    existing = {
        a.day_of_week: a
        for a in db.query(models.Availability)
        .filter_by(user_id=current_user.id)
        .order_by(models.Availability.day_of_week)
        .all()
    }

    result = []
    for item in payload:
        if item.day_of_week in existing:
            # Update existing row
            row = existing[item.day_of_week] # type: ignore[index]
            row.available_minutes = item.available_minutes # type: ignore[index]
        else:
            # Insert new row
            row = models.Availability(user_id=current_user.id, **item.dict())
            db.add(row)
        db.flush() # Prepare teh row for use before commit
        result.append(row)

    db.commit()
    return result