from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from .. import models
from ..router import get_db
from ..schemas import ScheduleOut

router = APIRouter()

@router.get("/schedule/generate", response_model=ScheduleOut)
def generate_schedule(db: Session = Depends(get_db), user_id: int = 1):
    # Get today's weekday
    today = datetime.now()
    day_of_week = today.weekday()
    
    # Get available minutes for today
    availability = (
        db.query(models.Availability)
        .filter_by(user_id=user_id, day_of_week=day_of_week)
        .first()
    )
    if not availability:
        raise HTTPException(status_code=404, detail="No availability set for today")
    
    available = availability.available_minutes
    
    # Get all activities, sorted by tier and priority
    priority_order = {"High": 1, "Medium": 2, "Low": 3}
    tier_order = {"Main Quest": 1, "Side Quest": 2, "Bonus Round": 3, "Free Play": 4}

    activities = (
        db.query(models.Activity)
        .filter_by(user_id=user_id)
        .all()
    )

    # Sort manually using tier + priority
    activities.sort(key=lambda a: (tier_order.get(a.tier, 99), priority_order.get(a.priority, 99)))
    
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
        else:
            break

    # Return the plan
    return {
        "date": today.strftime("%Y-%m-%d"),
        "day_of_week": day_of_week,
        "available_minutes": available,
        "used_minutes": used,
        "activities": plan
    }