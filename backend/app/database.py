from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Quick start with SQLite. Will swap to Postgres later.
DATABASE_URL = "sqlite:///./timeforge.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()