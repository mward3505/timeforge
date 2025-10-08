# app/main.py
from fastapi import FastAPI
from .database import Base, engine
from . import router
from .routers import schedule

Base.metadata.create_all(bind=engine)

app = FastAPI(title="TimeForge API (MVP)")

@app.get("/")
def root():
    return {"message": "Welcome to TimeForge API — MVP phase running!"}

app.include_router(router.router)
app.include_router(schedule.router)