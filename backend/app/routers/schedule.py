from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from .. import models
from ..router import get_db
from ..schemas import GenerateScheduleOut, SavedScheduleOut, SavedScheduleIn
import json

router = APIRouter()

@router.get("/schedule/generate", response_model=GenerateScheduleOut)
def generate_schedule(db: Session = Depends(get_db), user_id: int = 1):
    # Get today's weekday
    today = datetime.now()
    day_of_week = today.weekday()
    
    print(f"--- Schedule generation for user {user_id} ---")
    print(f"Date: {today.strftime('%Y-%m-%d')} (weekday {day_of_week})")
    
    # Get available minutes for today
    availability = (
        db.query(models.Availability)
        .filter_by(user_id=user_id, day_of_week=day_of_week)
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
        .filter_by(user_id=user_id)
        .all()
    )
    activities.sort(key=lambda a: (tier_order.get(a.tier, 99), priority_order.get(a.priority, 99)))
    
    print(f"Loaded {len(activities)} activities: {[a.name for a in activities[:3]]}...")
    
    # Allocate Time
    used = 0
    plan = []
    for a in activities:
        if used + a.estimated_minutes <= available:
            plan.append({
                "id": a.id,
                "name": a.name,
                "tier": a.tier,
                "prioirity": a.priority,
                "allocated_minutes": a.estimated_minutes
            })
            used += a.estimated_minutes
            print(f"✅ Added: {a.name} ({a.tier}, {a.estimated_minutes}m) — total used now {used}/{available}")
        else:
            print(f"⏭️ Skipped: {a.name} ({a.tier}, {a.estimated_minutes}m) — not enough time left ({available - used}m remaining)")
            continue

    print(f"--- Schedule complete: used {used}/{available} minutes ---")

    # Return the plan
    return {
        "date": today.strftime("%Y-%m-%d"),
        "day_of_week": day_of_week,
        "available_minutes": available,
        "used_minutes": used,
        "activities": plan
    }


@router.post("/schedule/save", status_code=status.HTTP_201_CREATED)
def save_schedule(data: SavedScheduleIn, db: Session = Depends(get_db)):
    db_schedule = models.Schedule(
        user_id=data.user_id,
        date=data.date,
        day_of_week=data.day_of_week,
        available_minutes=data.available_minutes,
        used_minutes=data.used_minutes,
        activities_json=json.dumps(data.activities)
    )
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    return {"message": "Schedule saved", "id": db_schedule.id}


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