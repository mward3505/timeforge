# app/models.py
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)


class Activity(Base):
    __tablename__ = "activities"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    name = Column(String, nullable=False)
    tier = Column(String, nullable=False)       # "Main Quest" | "Side Quest" | "Bonus Round" | "Free Play"
    priority = Column(String, nullable=False)   # "High" | "Medium" | "Low"
    estimated_minutes = Column(Integer, nullable=False)

class Availability(Base):
    __tablename__ = "availability"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday 
    available_minutes = Column(Integer, nullable=False)

class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    date = Column(String, nullable=False)
    day_of_week = Column(Integer, nullable=False)
    available_minutes = Column(Integer, nullable=False)
    used_minutes = Column(Integer, nullable=False)
    activities_json = Column(Text, nullable=False)  # store list of activities as JSON


class TimeBlock(Base):
    __tablename__ = "time_blocks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # if your user table is named differently, tell me

    day_of_week = Column(Integer, nullable=False)  # 0–6
    start_minutes = Column(Integer, nullable=False)
    duration_minutes = Column(Integer, nullable=False)

    title = Column(String, nullable=False)
    
class ScheduleItem(Base):
    __tablename__ = "schedule_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)

    activity_id = Column(
        Integer,
        ForeignKey("activities.id"),
        nullable=False
    )

    day_of_week = Column(Integer, nullable=False)  # 0–6
    start_minute = Column(Integer, nullable=False)
    end_minute = Column(Integer, nullable=False)


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Integer, default=0)  # 0 = unused, 1 = used
