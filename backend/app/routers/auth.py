from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import SessionLocal
from .. import models, schemas
from ..auth import hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register", response_model=schemas.UserOut)
def register_user(
    payload: schemas.UserCreate,
    db: Session = Depends(get_db),
):
    exisiting = db.query(models.User).filter_by(email=payload.email).first()
    if exisiting:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    user = models.User(
        email = payload.email,
        password_hash = hash_password(payload.password),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user