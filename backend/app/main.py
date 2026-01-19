# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from . import router
from .routers import schedule, auth, time_blocks, activities, schedule_items

Base.metadata.create_all(bind=engine)

app = FastAPI(title="TimeForge API (MVP)")

origins = [
    "http://localhost:5173",              # local Vite dev
    "https://timeforge-mvp.netlify.app", # deployed frontend
    "https://timeforge-production.up.railway.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Welcome to TimeForge API — MVP phase running!"}

app.include_router(auth.router)
app.include_router(schedule.router)
app.include_router(time_blocks.router)
app.include_router(activities.router)
app.include_router(schedule_items.router)