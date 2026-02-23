from fastapi import APIRouter, Depends, HTTPException, status, Cookie
from sqlalchemy.orm import Session

from ..database import SessionLocal
from .. import models, schemas
from ..jwt import decode_access_token

router = APIRouter(prefix="/activities", tags=["activities"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ✅ COOKIE-BASED AUTH (MATCHES FRONTEND)
def get_current_user(
    db: Session = Depends(get_db),
    access_token: str | None = Cookie(default=None),
):
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    payload = decode_access_token(access_token)
    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(status_code=401)

    user = db.query(models.User).filter_by(id=int(user_id)).first()
    if not user:
        raise HTTPException(status_code=401)

    return user


@router.get("/", response_model=list[schemas.ActivityOut])
def list_activities(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return (
        db.query(models.Activity)
        .filter(models.Activity.user_id == current_user.id)
        .all()
    )


@router.post("/", response_model=schemas.ActivityOut)
def create_activity(
    payload: schemas.ActivityCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    activity = models.Activity(
        user_id=current_user.id,
        **payload.dict(),
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity


@router.put("/{activity_id}", response_model=schemas.ActivityOut)
def update_activity(
    activity_id: int,
    payload: schemas.ActivityCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    activity = (
        db.query(models.Activity)
        .filter(
            models.Activity.id == activity_id,
            models.Activity.user_id == current_user.id,
        )
        .first()
    )

    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    activity.name = payload.name
    activity.tier = payload.tier
    activity.priority = payload.priority
    activity.estimated_minutes = payload.estimated_minutes

    db.commit()
    db.refresh(activity)
    return activity


@router.delete("/{activity_id}", status_code=204)
def delete_activity(
    activity_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    activity = (
        db.query(models.Activity)
        .filter(
            models.Activity.id == activity_id,
            models.Activity.user_id == current_user.id,
        )
        .first()
    )

    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    db.query(models.ScheduleItem).filter(
        models.ScheduleItem.activity_id == activity_id
    ).delete()

    db.delete(activity)
    db.commit()
