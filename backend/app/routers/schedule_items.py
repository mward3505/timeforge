from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import SessionLocal
from ..dependencies import get_current_user
from .. import models, schemas

router = APIRouter(
    prefix="/schedule-items",
    tags=["schedule-items"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=list[schemas.ScheduleItemOut])
def list_schedule_items(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return (
        db.query(models.ScheduleItem)
        .filter(models.ScheduleItem.user_id == current_user.id)
        .all()
    )


@router.post("/", response_model=schemas.ScheduleItemOut)
def create_schedule_item(
    payload: schemas.ScheduleItemCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # 🔒 Validate time window
    if payload.end_minute <= payload.start_minute:
        raise HTTPException(
            status_code=400,
            detail="End time must be after start time",
        )

    # 🔒 Validate activity belongs to user
    activity = (
        db.query(models.Activity)
        .filter(
            models.Activity.id == payload.activity_id,
            models.Activity.user_id == current_user.id,
        )
        .first()
    )

    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    # 🔒 Validate duration fits activity
    duration = payload.end_minute - payload.start_minute
    if duration > activity.estimated_minutes:
        raise HTTPException(
            status_code=400,
            detail="Activity duration exceeds estimated time",
        )

    item = models.ScheduleItem(
        user_id=current_user.id,
        activity_id=payload.activity_id,
        day_of_week=payload.day_of_week,
        start_minute=payload.start_minute,
        end_minute=payload.end_minute,
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    return item


@router.delete("/{item_id}", status_code=204)
def delete_schedule_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    item = (
        db.query(models.ScheduleItem)
        .filter(
            models.ScheduleItem.id == item_id,
            models.ScheduleItem.user_id == current_user.id,
        )
        .first()
    )

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    db.delete(item)
    db.commit()