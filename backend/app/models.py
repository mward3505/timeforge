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
