from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.user import User
from app.schemas.admin_user import (
    AdminUserCreate,
    AdminUserDetailsResponse,
    AdminUserResponse,
    AdminUserUpdate,
    EnrollmentResponse,
)
from app.core.security import hash_password
from app.routes.auth import get_current_admin_user

router = APIRouter(prefix="/admin/users", tags=["Admin Users"])


@router.get("", response_model=list[AdminUserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    users = (
        db.query(User)
        .filter(User.tenant_id == current_admin.tenant_id)
        .order_by(User.name.asc(), User.email.asc())
        .all()
    )
    return users


@router.get("/{user_id}", response_model=AdminUserDetailsResponse)
def get_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    user = (
        db.query(User)
        .filter(
            User.id == user_id,
            User.tenant_id == current_admin.tenant_id,
        )
        .first()
    )

    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    enrollments = (
        db.query(Enrollment, Course)
        .join(Course, Enrollment.course_id == Course.id)
        .filter(
            Enrollment.user_id == user.id,
            Enrollment.tenant_id == current_admin.tenant_id,
            Course.tenant_id == current_admin.tenant_id,
        )
        .order_by(Course.title.asc())
        .all()
    )

    return {
        "id": user.id,
        "name": user.name,
        "last_name": user.last_name,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
        "tenant_id": user.tenant_id,
        "enrollments": [
            EnrollmentResponse(
                course_id=course.id,
                course_title=course.title,
                status=enrollment.status,
            )
            for enrollment, course in enrollments
        ],
    }


@router.post("", response_model=AdminUserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: AdminUserCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    if payload.role not in {"admin", "student"}:
        raise HTTPException(status_code=400, detail="Perfil inválido.")

    existing_user = (
        db.query(User)
        .filter(User.email == payload.email.lower().strip())
        .first()
    )

    if existing_user:
        raise HTTPException(status_code=400, detail="Já existe usuário com este e-mail.")

    new_user = User(
        name=payload.name.strip(),
        last_name=payload.last_name.strip(),
        email=payload.email.lower().strip(),
        password_hash=hash_password(payload.password),
        role=payload.role,
        is_active=payload.is_active,
        tenant_id=current_admin.tenant_id,
    )

    db.add(new_user)
    db.flush()

    if payload.initial_course_ids:
        courses = (
            db.query(Course)
            .filter(
                Course.id.in_(payload.initial_course_ids),
                Course.tenant_id == current_admin.tenant_id,
            )
            .all()
        )

        found_course_ids = {course.id for course in courses}
        requested_course_ids = set(payload.initial_course_ids)

        if found_course_ids != requested_course_ids:
            raise HTTPException(
                status_code=400,
                detail="Um ou mais cursos informados não foram encontrados para este tenant.",
            )

        for course in courses:
            db.add(
                Enrollment(
                    tenant_id=current_admin.tenant_id,
                    user_id=new_user.id,
                    course_id=course.id,
                    status="active",
                )
            )

    db.commit()
    db.refresh(new_user)
    return new_user


@router.put("/{user_id}", response_model=AdminUserResponse)
def update_user(
    user_id: UUID,
    payload: AdminUserUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    if payload.role not in {"admin", "student"}:
        raise HTTPException(status_code=400, detail="Perfil inválido.")

    user = (
        db.query(User)
        .filter(
            User.id == user_id,
            User.tenant_id == current_admin.tenant_id,
        )
        .first()
    )

    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    email_in_use = (
        db.query(User)
        .filter(
            User.email == payload.email.lower().strip(),
            User.id != user_id,
        )
        .first()
    )

    if email_in_use:
        raise HTTPException(status_code=400, detail="Este e-mail já está em uso.")

    user.name = payload.name.strip()
    user.last_name = payload.last_name.strip()
    user.email = payload.email.lower().strip()
    user.role = payload.role
    user.is_active = payload.is_active

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}")
def delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    user = (
        db.query(User)
        .filter(
            User.id == user_id,
            User.tenant_id == current_admin.tenant_id,
        )
        .first()
    )

    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    if str(user.id) == str(current_admin.id):
        raise HTTPException(status_code=400, detail="Você não pode desativar seu próprio usuário.")

    user.is_active = False
    db.commit()

    return {"message": "Usuário desativado com sucesso."}


@router.delete("/{user_id}/hard-delete")
def hard_delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user = (
        db.query(User)
        .filter(User.id == user_id, User.tenant_id == current_user.tenant_id)
        .first()
    )

    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    if user.is_active:
        raise HTTPException(
            status_code=400,
            detail="Apenas usuários bloqueados podem ser excluídos definitivamente."
        )

    db.delete(user)
    db.commit()

    return {"message": "Usuário excluído definitivamente."}