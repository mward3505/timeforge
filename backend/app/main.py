# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from . import router
from .routers import schedule, auth

Base.metadata.create_all(bind=engine)

app = FastAPI(title="TimeForge API (MVP)")

origins = [
    "http://localhost:5173",              # local Vite dev
    "https://timeforge-mvp.netlify.app", # deployed frontend
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

app.include_router(router.router)
app.include_router(auth.router)
app.include_router(schedule.router)