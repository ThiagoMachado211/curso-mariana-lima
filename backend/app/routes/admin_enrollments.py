from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.user import User
from app.routes.auth import get_current_admin_user

router = APIRouter(prefix="/admin/users", tags=["Admin Enrollments"])


class EnrollmentCreatePayload(BaseModel):
    course_id: UUID


@router.get("/{user_id}/enrollments")
def list_user_enrollments(
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

    return [
        {
            "course_id": course.id,
            "course_title": course.title,
            "status": enrollment.status,
        }
        for enrollment, course in enrollments
    ]


@router.post("/{user_id}/enrollments", status_code=status.HTTP_201_CREATED)
def enroll_user_in_course(
    user_id: UUID,
    payload: EnrollmentCreatePayload,
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

    course = (
        db.query(Course)
        .filter(
            Course.id == payload.course_id,
            Course.tenant_id == current_admin.tenant_id,
        )
        .first()
    )

    if not course:
        raise HTTPException(status_code=404, detail="Curso não encontrado.")

    enrollment = (
        db.query(Enrollment)
        .filter(
            Enrollment.user_id == user.id,
            Enrollment.course_id == course.id,
            Enrollment.tenant_id == current_admin.tenant_id,
        )
        .first()
    )

    if enrollment:
        if enrollment.status == "active":
            raise HTTPException(status_code=400, detail="Aluno já está matriculado neste curso.")

        enrollment.status = "active"
        db.commit()
        return {"message": "Matrícula reativada com sucesso."}

    db.add(
        Enrollment(
            tenant_id=current_admin.tenant_id,
            user_id=user.id,
            course_id=course.id,
            status="active",
        )
    )
    db.commit()

    return {"message": "Aluno matriculado com sucesso."}


@router.delete("/{user_id}/enrollments/{course_id}")
def unenroll_user_from_course(
    user_id: UUID,
    course_id: UUID,
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

    enrollment = (
        db.query(Enrollment)
        .filter(
            Enrollment.user_id == user.id,
            Enrollment.course_id == course_id,
            Enrollment.tenant_id == current_admin.tenant_id,
        )
        .first()
    )

    if not enrollment:
        raise HTTPException(status_code=404, detail="Matrícula não encontrada.")

    enrollment.status = "cancelled"
    db.commit()

    return {"message": "Aluno desmatriculado com sucesso."}