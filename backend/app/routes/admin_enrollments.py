import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.deps import get_db
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.user import User
from app.schemas.enrollment import EnrollmentCreate, EnrollmentOut

router = APIRouter(prefix="/admin/enrollments", tags=["admin-enrollments"])


def ensure_admin(current_user: User):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem acessar esta área.",
        )


@router.get("", response_model=list[EnrollmentOut])
def list_enrollments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_admin(current_user)

    enrollments = (
        db.query(Enrollment)
        .filter(Enrollment.tenant_id == current_user.tenant_id)
        .order_by(Enrollment.created_at.desc())
        .all()
    )
    return enrollments


@router.post("", response_model=EnrollmentOut, status_code=status.HTTP_201_CREATED)
def create_enrollment(
    payload: EnrollmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_admin(current_user)

    student = (
        db.query(User)
        .filter(
            User.id == payload.user_id,
            User.tenant_id == current_user.tenant_id,
            User.role == "student",
            User.is_active == True,
        )
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aluno não encontrado.",
        )

    course = (
        db.query(Course)
        .filter(
            Course.id == payload.course_id,
            Course.tenant_id == current_user.tenant_id,
            Course.is_active == True,
        )
        .first()
    )

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curso não encontrado.",
        )

    existing = (
        db.query(Enrollment)
        .filter(
            Enrollment.tenant_id == current_user.tenant_id,
            Enrollment.user_id == payload.user_id,
            Enrollment.course_id == payload.course_id,
        )
        .first()
    )

    if existing:
        if existing.status != "active":
            existing.status = "active"
            db.commit()
            db.refresh(existing)
        return existing

    enrollment = Enrollment(
        tenant_id=current_user.tenant_id,
        user_id=payload.user_id,
        course_id=payload.course_id,
        status="active",
    )

    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)

    return enrollment


@router.delete("/{enrollment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_enrollment(
    enrollment_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_admin(current_user)

    enrollment = (
        db.query(Enrollment)
        .filter(
            Enrollment.id == enrollment_id,
            Enrollment.tenant_id == current_user.tenant_id,
        )
        .first()
    )

    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Matrícula não encontrada.",
        )

    db.delete(enrollment)
    db.commit()