# app/main.py
from fastapi import FastAPI
from .database import Base, engine
from .routers import router as api_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="TimeForge API (MVP)")
app.include_router(api_router)
