import os
import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status, Response, Cookie
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

from ..database import SessionLocal
from .. import models, schemas
from ..auth import hash_password, verify_password
from ..jwt import create_access_token, decode_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

# Email configuration
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
FROM_EMAIL = os.getenv("FROM_EMAIL", "timeforge.app.noreply@gmail.com")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://timeforge-mvp.netlify.app")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/me", response_model=schemas.UserOut)
def get_current_user(
    db: Session = Depends(get_db),
    access_token: str | None = Cookie(default=None),
):
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    # Decode token
    payload = decode_access_token(access_token)

    sub = payload.get("sub")
    if sub is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    
    user_id = int(sub)
    user = db.query(models.User).filter_by(id=user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user

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

@router.post("/login")
def login_user(
    payload: schemas.UserLogin,
    response: Response,
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter_by(email=payload.email).first()
    
    if not user or not verify_password(payload.password, str(user.password_hash)):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    
    access_token = create_access_token(data={"sub": str(user.id)})

    # 🔥 Set secure cookie for cross-origin requests
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,    # Required for SameSite=None
        samesite="none",  # Allows cross-site cookies (Netlify -> Render)
        max_age=60 * 60 * 24,  # 24 hours
    )

    return {"success": True}

@router.post("/logout")
def logout():
    response = JSONResponse({"success": True})
    response.delete_cookie(
        key="access_token",
        path="/",
        secure=True,
        samesite="none"
    )

    return response


@router.post("/forgot-password")
def forgot_password(
    payload: schemas.ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    """Request a password reset email."""
    user = db.query(models.User).filter_by(email=payload.email).first()

    # Always return success to prevent email enumeration
    if not user:
        return {"success": True, "message": "If an account exists, a reset email has been sent."}

    # Generate a secure token
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=1)

    # Delete any existing tokens for this user
    db.query(models.PasswordResetToken).filter_by(user_id=user.id).delete()

    # Create new token
    reset_token = models.PasswordResetToken(
        user_id=user.id,
        token=token,
        expires_at=expires_at,
    )
    db.add(reset_token)
    db.commit()

    # Send email
    reset_link = f"{FRONTEND_URL}/reset-password?token={token}"

    message = Mail(
        from_email=FROM_EMAIL,
        to_emails=user.email,
        subject="TimeForge - Password Reset",
        html_content=f"""
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password for TimeForge.</p>
        <p>Click the link below to reset your password:</p>
        <p><a href="{reset_link}">{reset_link}</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        """
    )

    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        sg.send(message)
    except Exception as e:
        print(f"Failed to send email: {e}")
        # Still return success to prevent enumeration

    return {"success": True, "message": "If an account exists, a reset email has been sent."}


@router.post("/reset-password")
def reset_password(
    payload: schemas.ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    """Reset password using a valid token."""
    reset_token = db.query(models.PasswordResetToken).filter_by(
        token=payload.token,
        used=0
    ).first()

    if not reset_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token.",
        )

    if reset_token.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired.",
        )

    # Get the user and update password
    user = db.query(models.User).filter_by(id=reset_token.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found.",
        )

    user.password_hash = hash_password(payload.new_password)
    reset_token.used = 1

    db.commit()

    return {"success": True, "message": "Password has been reset successfully."}