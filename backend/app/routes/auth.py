import re
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.core.security import (
    verify_password,
    create_access_token,
    hash_password,
)
from app.db.deps import get_db
from app.models.tenant import Tenant
from app.models.user import User
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.password_reset_token import PasswordResetToken
from app.schemas.auth import LoginRequest, TokenResponse, RegisterRequest
from app.schemas.user import UserOut
from app.core.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=10)
    password: str = Field(..., min_length=6, max_length=255)


def get_current_admin_user(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso permitido apenas para administradores.",
        )
    return user


def build_tenant_slug_from_email(email: str) -> str:
    base = email.split("@")[0].strip().lower()
    base = re.sub(r"[^a-z0-9]+", "-", base).strip("-")
    return base or "tenant"


def enroll_user_in_default_course(db: Session, user: User):
    default_course = (
        db.query(Course)
        .filter(
            Course.tenant_id == user.tenant_id,
            Course.title == "Matemática Essencial",
            Course.is_active == True,
        )
        .first()
    )

    if not default_course:
        return

    existing_enrollment = (
        db.query(Enrollment)
        .filter(
            Enrollment.user_id == user.id,
            Enrollment.course_id == default_course.id,
        )
        .first()
    )

    if existing_enrollment:
        return

    enrollment = Enrollment(
        tenant_id=user.tenant_id,
        user_id=user.id,
        course_id=default_course.id,
        status="active",
    )

    db.add(enrollment)
    db.commit()


def get_or_create_default_tenant(db: Session, data: RegisterRequest) -> Tenant:
    tenant = db.query(Tenant).first()
    if tenant:
        return tenant

    base_slug = build_tenant_slug_from_email(data.email)
    slug = base_slug
    counter = 1

    while db.query(Tenant).filter(Tenant.slug == slug).first():
        counter += 1
        slug = f"{base_slug}-{counter}"

    tenant = Tenant(
        slug=slug,
        name=f"Tenant de {data.name} {data.last_name}",
    )
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    return tenant


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    normalized_email = data.email.strip().lower()

    existing = db.query(User).filter(User.email == normalized_email).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já cadastrado",
        )

    tenant = get_or_create_default_tenant(db, data)

    user = User(
        tenant_id=tenant.id,
        name=data.name.strip(),
        last_name=data.last_name.strip(),
        email=normalized_email,
        password_hash=hash_password(data.password),
        role="student",
        is_active=True,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    enroll_user_in_default_course(db, user)

    return user


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    normalized_email = data.email.strip().lower()

    user = db.query(User).filter(User.email == normalized_email).first()

    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas",
        )

    if not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas",
        )

    token = create_access_token(subject=str(user.id))
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    normalized_email = data.email.strip().lower()

    user = db.query(User).filter(User.email == normalized_email).first()

    # Não revela se o email existe ou não
    if not user:
        return {"message": "Se o email existir, você receberá instruções para redefinir a senha."}

    # Invalida tokens ainda não usados do mesmo usuário
    existing_tokens = (
        db.query(PasswordResetToken)
        .filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used == False,
        )
        .all()
    )

    for existing_token in existing_tokens:
        existing_token.used = True

    token = secrets.token_urlsafe(48)

    reset_token = PasswordResetToken(
        user_id=user.id,
        token=token,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
        used=False,
    )

    db.add(reset_token)
    db.commit()

    reset_link = f"https://curso-mariana-lima.vercel.app/reset-password.html?token={token}"
    print(f"[RESET PASSWORD LINK] {reset_link}")

    return {"message": "Se o email existir, você receberá instruções para redefinir a senha."}


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    reset_token = (
        db.query(PasswordResetToken)
        .filter(PasswordResetToken.token == data.token)
        .first()
    )

    if not reset_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido ou expirado.",
        )

    if reset_token.used:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este link de redefinição já foi utilizado.",
        )

    if reset_token.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido ou expirado.",
        )

    user = db.query(User).filter(User.id == reset_token.user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado.",
        )

    user.password_hash = hash_password(data.password)
    reset_token.used = True

    db.commit()

    return {"message": "Senha redefinida com sucesso."}