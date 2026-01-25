from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
import json

from .. import models
from ..router import get_db
from ..schemas import GenerateScheduleOut, SavedScheduleOut, SavedScheduleIn
from ..dependencies import get_current_user

router = APIRouter()

@router.post("/schedule/generate-today")
def generate_today_schedule(
    day_of_week: Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Generate schedule for today only. Accepts optional day_of_week from frontend for timezone accuracy."""

    # Use frontend-provided day if available (for timezone accuracy), otherwise use server time
    if day_of_week is None:
        today = datetime.now()
        day_of_week = today.weekday()
    day_name = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][day_of_week]

    # Clear existing schedule items for today only
    db.query(models.ScheduleItem).filter_by(
        user_id=current_user.id,
        day_of_week=day_of_week
    ).delete()

    priority_order = {"High": 1, "Medium": 2, "Low": 3}
    tier_order = {"Main Quest": 1, "Side Quest": 2, "Bonus Round": 3, "Free Play": 4}

    # Get availability for today
    availability = (
        db.query(models.Availability)
        .filter_by(user_id=current_user.id, day_of_week=day_of_week)
        .first()
    )

    if not availability or availability.available_minutes == 0:
        raise HTTPException(
            status_code=400,
            detail=f"No availability set for {day_name}. Please set your weekly availability first."
        )

    available = availability.available_minutes

    # Get all activities sorted by tier and priority
    activities = (
        db.query(models.Activity)
        .filter_by(user_id=current_user.id)
        .all()
    )

    if not activities:
        raise HTTPException(
            status_code=400,
            detail="No activities found. Please create some activities first."
        )

    activities.sort(key=lambda a: (tier_order.get(a.tier, 99), priority_order.get(a.priority, 99)))

    used = 0
    scheduled_count = 0

    # Allocate activities to today
    for activity in activities:
        if used + activity.estimated_minutes <= available:
            schedule_item = models.ScheduleItem(
                user_id=current_user.id,
                activity_id=activity.id,
                day_of_week=day_of_week,
                start_minute=used,
                end_minute=used + activity.estimated_minutes
            )
            db.add(schedule_item)
            used += activity.estimated_minutes
            scheduled_count += 1

    db.commit()

    return {
        "status": "success",
        "message": f"Generated schedule for {day_name} with {scheduled_count} activities",
        "day_of_week": day_of_week,
        "day_name": day_name,
        "available_minutes": available,
        "used_minutes": used,
        "activities_scheduled": scheduled_count
    }


@router.post("/schedule/generate-week")
def generate_week_schedule(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Generate schedule for entire week (all activities on all days)"""

    # Clear all existing schedule items for the user
    db.query(models.ScheduleItem).filter_by(user_id=current_user.id).delete()

    priority_order = {"High": 1, "Medium": 2, "Low": 3}
    tier_order = {"Main Quest": 1, "Side Quest": 2, "Bonus Round": 3, "Free Play": 4}

    # Get all activities sorted by tier and priority
    activities = (
        db.query(models.Activity)
        .filter_by(user_id=current_user.id)
        .all()
    )

    if not activities:
        raise HTTPException(
            status_code=400,
            detail="No activities found. Please create some activities first."
        )

    activities.sort(key=lambda a: (tier_order.get(a.tier, 99), priority_order.get(a.priority, 99)))

    generated_days = []

    # Generate for each day of the week
    for day_of_week in range(7):
        availability = (
            db.query(models.Availability)
            .filter_by(user_id=current_user.id, day_of_week=day_of_week)
            .first()
        )

        if not availability or availability.available_minutes == 0:
            continue

        available = availability.available_minutes
        used = 0

        # Allocate activities to this day
        for activity in activities:
            if used + activity.estimated_minutes <= available:
                schedule_item = models.ScheduleItem(
                    user_id=current_user.id,
                    activity_id=activity.id,
                    day_of_week=day_of_week,
                    start_minute=used,
                    end_minute=used + activity.estimated_minutes
                )
                db.add(schedule_item)
                used += activity.estimated_minutes

        generated_days.append({
            "day_of_week": day_of_week,
            "available_minutes": available,
            "used_minutes": used
        })

    db.commit()

    return {
        "status": "success",
        "message": f"Generated schedule for {len(generated_days)} days",
        "days": generated_days
    }

@router.get("/schedule/generate", response_model=GenerateScheduleOut)
def generate_schedule(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Get today's weekday
    today = datetime.now()
    day_of_week = today.weekday()

    print(f"--- Schedule generation for user {current_user.id} ---")
    print(f"Date: {today.strftime('%Y-%m-%d')} (weekday {day_of_week})")

    # Get available minutes for today
    availability = (
        db.query(models.Availability)
        .filter_by(user_id=current_user.id, day_of_week=day_of_week)
        .first()
    )
    if not availability:
        raise HTTPException(status_code=404, detail="No availability set for today")

    available = availability.available_minutes
    print(f"Available minutes: {available}")

    # Get all activities, sorted by tier and priority
    priority_order = {"High": 1, "Medium": 2, "Low": 3}
    tier_order = {"Main Quest": 1, "Side Quest": 2, "Bonus Round": 3, "Free Play": 4}

    activities = (
        db.query(models.Activity)
        .filter_by(user_id=current_user.id)
        .all()
    )
    activities.sort(key=lambda a: (tier_order.get(a.tier, 99), priority_order.get(a.priority, 99)))

    print(f"Loaded {len(activities)} activities: {[a.name for a in activities[:3]]}...")

    # Clear existing schedule items for today
    db.query(models.ScheduleItem).filter_by(user_id=current_user.id, day_of_week=day_of_week).delete()

    # Allocate Time and create ScheduleItem records
    used = 0
    plan = []
    for a in activities:
        if used + a.estimated_minutes <= available:
            # Create ScheduleItem record
            schedule_item = models.ScheduleItem(
                user_id=current_user.id,
                activity_id=a.id,
                day_of_week=day_of_week,
                start_minute=used,  # For abstract budget, just track cumulative time
                end_minute=used + a.estimated_minutes
            )
            db.add(schedule_item)

            plan.append({
                "id": a.id,
                "name": a.name,
                "tier": a.tier,
                "priority": a.priority,
                "allocated_minutes": a.estimated_minutes
            })
            used += a.estimated_minutes
            print(f"✅ Added: {a.name} ({a.tier}, {a.estimated_minutes}m) — total used now {used}/{available}")
        else:
            print(f"⏭️ Skipped: {a.name} ({a.tier}, {a.estimated_minutes}m) — not enough time left ({available - used}m remaining)")
            continue

    db.commit()
    print(f"--- Schedule complete: used {used}/{available} minutes ---")

    # Return the plan
    return {
        "date": today.strftime("%Y-%m-%d"),
        "day_of_week": day_of_week,
        "available_minutes": available,
        "used_minutes": used,
        "activities": plan
    }

@router.post("/schedule/save")
def save_schedule(
    payload: SavedScheduleIn,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    import json

    existing = (
        db.query(models.Schedule)
        .filter(models.Schedule.user_id == current_user.id)
        .filter(models.Schedule.date == payload.date)
        .first()
    )

    if existing:
        existing.available_minutes = payload.available_minutes
        existing.used_minutes = payload.used_minutes
        existing.day_of_week = payload.day_of_week
        existing.activities_json = json.dumps(payload.activities)
    else:
        schedule = models.Schedule(
            user_id=current_user.id,
            date=payload.date,
            day_of_week=payload.day_of_week,
            available_minutes=payload.available_minutes,
            used_minutes=payload.used_minutes,
            activities_json=json.dumps([a.model_dump() for a in payload.activities]),
        )
        db.add(schedule)

    db.commit()
    return {"status": "success"}


@router.get("/schedule/load", response_model=SavedScheduleOut)
def load_schedule(user_id: int, db: Session = Depends(get_db)):
    sched = (
        db.query(models.Schedule)
        .filter(models.Schedule.user_id == user_id)
        .order_by(models.Schedule.id.desc())
        .first()
    )
    if not sched:
        raise HTTPException(status_code=404, detail="No saved schedule found")
    
    data = json.loads(sched.activities_json)
    return {
        "id": sched.id,
        "user_id": sched.user_id,
        "date": sched.date,
        "day_of_week": sched.day_of_week,
        "available_minutes": sched.available_minutes,
        "used_minutes": sched.used_minutes,
        "activities": data
    }

@router.get("/schedule/today", response_model=SavedScheduleOut)
def get_today_schedule(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    today = datetime.now().strftime("%Y-%m-%d")
    day_of_week = datetime.now().weekday()

    # Check for saved schedule first
    sched = (
        db.query(models.Schedule)
        .filter(models.Schedule.user_id == current_user.id)
        .filter(models.Schedule.date == today)
        .first()
    )

    if sched:
        return {
            "id": sched.id,
            "user_id": sched.user_id,
            "date": sched.date,
            "day_of_week": sched.day_of_week,
            "available_minutes": sched.available_minutes,
            "used_minutes": sched.used_minutes,
            "activities": json.loads(sched.activities_json),
        }

    # Otherwise: auto-generate using the existing logic
    result = generate_schedule(db, user_id=current_user.id)

    # Save it automatically
    schedule = models.Schedule(
        user_id=current_user.id,
        date=result["date"],
        day_of_week=result["day_of_week"],
        available_minutes=result["available_minutes"],
        used_minutes=result["used_minutes"],
        activities_json=json.dumps(result["activities"]),
    )
    db.add(schedule)
    db.commit()

    return schedule