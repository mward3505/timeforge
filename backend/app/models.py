# app/models.py
from sqlalchemy import Column, Integer, String
from .database import Base

class Activity(Base):
    __tablename__ = "activities"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    tier = Column(String, nullable=False)       # "Main Quest" | "Side Quest" | "Bonus Round" | "Free Play"
    priority = Column(String, nullable=False)   # "High" | "Medium" | "Low"
    estimated_minutes = Column(Integer, nullable=False)

class Availability(Base):
    __tablename__ = "availability"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday 
    available_minutes = Column(Integer, nullable=False)