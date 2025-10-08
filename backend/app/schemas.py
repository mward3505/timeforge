# app/schemas.py
from pydantic import BaseModel
from typing import List

class ActivityCreate(BaseModel):
    name: str
    tier: str
    priority: str
    estimated_minutes: int

class ActivityOut(ActivityCreate):
    id: int
    class Config:
        from_attributes = True

class AvailabilityUpsert(BaseModel):
    day_of_week: int  # 0=Monday, 6=Sunday
    available_minutes: int

class AvailabilityOut(AvailabilityUpsert):
    id: int
    class Config:
        from_attributes = True

class ScheduleActivity(BaseModel):
    id: int
    name: str
    tier: str
    prioirity: str
    allocated_minutes: int

    class Config:
        from_attributes = True

class ScheduleOut(BaseModel):
    date: str
    day_of_week: int
    available_minutes: int
    used_minutes: int
    activities: List[ScheduleActivity]