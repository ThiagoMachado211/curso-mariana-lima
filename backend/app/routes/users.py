from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.deps import get_db
from app.models.user import User

router = APIRouter(prefix="/users", tags=["users"])


class UpdateMePayload(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    last_name: str = Field(..., min_length=1, max_length=120)
    email: EmailStr


class UserMeOut(BaseModel):
    id: str
    tenant_id: str
    name: str
    last_name: str
    email: EmailStr
    role: str
    is_active: bool


@router.put("/me", response_model=UserMeOut)
def update_me(
    data: UpdateMePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    normalized_email = data.email.strip().lower()

    existing_user = (
        db.query(User)
        .filter(
            User.email == normalized_email,
            User.id != current_user.id,
        )
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este e-mail já está em uso.",
        )

    current_user.name = data.name.strip()
    current_user.last_name = data.last_name.strip()
    current_user.email = normalized_email

    db.commit()
    db.refresh(current_user)

    return {
        "id": str(current_user.id),
        "tenant_id": str(current_user.tenant_id),
        "name": current_user.name,
        "last_name": current_user.last_name,
        "email": current_user.email,
        "role": current_user.role,
        "is_active": current_user.is_active,
    }