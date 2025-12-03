# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from . import router
from .routers import schedule

Base.metadata.create_all(bind=engine)

app = FastAPI(title="TimeForge API (MVP)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    origins = "*",
)

@app.get("/")
def root():
    return {"message": "Welcome to TimeForge API — MVP phase running!"}

app.include_router(router.router)
app.include_router(schedule.router)