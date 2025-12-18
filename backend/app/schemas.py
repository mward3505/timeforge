# app/schemas.py
from pydantic import BaseModel, EmailStr
from typing import List, Any

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
    priority: str
    allocated_minutes: int

    class Config:
        from_attributes = True

class GenerateScheduleOut(BaseModel):
    date: str
    day_of_week: int
    available_minutes: int
    used_minutes: int
    activities: List[ScheduleActivity]

class SavedScheduleIn(BaseModel):
    user_id: int
    date: str
    day_of_week: int
    available_minutes: int
    used_minutes: int
    activities: List[Any]

class SavedScheduleOut(SavedScheduleIn):
    id: int
    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    email: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str= "bearer"

class ScheduleItem(BaseModel):
    name: str
    estimated_minutes: int

class ScheduleSaveRequest(BaseModel):
    date: str # YYYY-MM-DD
    available_minutes: int
    used_minutes: int
    day_of_week: int
    activities: List[ScheduleItem]