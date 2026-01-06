from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..models import TimeBlock
from ..schemas import TimeBlockCreate
from ..dependencies import get_current_user, get_db

router = APIRouter(
    prefix="/time-blocks",
    tags=["time-blocks"],
)


@router.post("/")
def create_time_block(
    block: TimeBlockCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    time_block = TimeBlock(
        user_id=current_user.id,
        day_of_week=block.day_of_week,
        start_minutes=block.start_minutes,
        duration_minutes=block.duration_minutes,
        title=block.title,
    )

    db.add(time_block)
    db.commit()
    db.refresh(time_block)

    return time_block

@router.get("/")
def get_time_blocks(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return (
        db.query(TimeBlock)
        .filter(TimeBlock.user_id == current_user.id)
        .all()
    )

