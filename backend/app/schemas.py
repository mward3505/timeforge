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
        orm_mode = True
