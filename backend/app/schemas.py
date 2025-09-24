# app/schemas.py
from pydantic import BaseModel

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