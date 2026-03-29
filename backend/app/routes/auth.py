import re

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    verify_password,
    create_access_token,
    hash_password,
)
from app.db.deps import get_db
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, RegisterRequest
from app.schemas.user import UserOut
from app.core.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


def build_tenant_slug_from_email(email: str) -> str:
    base = email.split("@")[0].strip().lower()
    base = re.sub(r"[^a-z0-9]+", "-", base).strip("-")
    return base or "tenant"


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
    existing = db.query(User).filter(User.email == data.email).first()

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
        email=data.email.strip().lower(),
        password_hash=hash_password(data.password),
        role="student",
        is_active=True,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()

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