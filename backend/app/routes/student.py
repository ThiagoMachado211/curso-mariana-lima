from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.deps import get_db
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.lesson import Lesson
from app.models.module import Module
from app.models.user import User
from app.schemas.student import (
    StudentCourseOut,
    StudentLessonOut,
    StudentModuleOut,
)

router = APIRouter(prefix="/student", tags=["student"])


def ensure_student(current_user: User):
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas alunos podem acessar esta área.",
        )


@router.get("/courses", response_model=list[StudentCourseOut])
def list_student_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_student(current_user)

    courses = (
        db.query(Course)
        .join(Enrollment, Enrollment.course_id == Course.id)
        .filter(
            Enrollment.user_id == current_user.id,
            Course.tenant_id == current_user.tenant_id,
            Course.is_active == True,
            Course.is_published == True,
        )
        .order_by(Course.title.asc())
        .all()
    )

    return courses


@router.get("/courses/{course_id}/modules", response_model=list[StudentModuleOut])
def list_student_course_modules(
    course_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_student(current_user)

    enrollment = (
        db.query(Enrollment)
        .filter(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == course_id,
        )
        .first()
    )

    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curso não encontrado para este aluno.",
        )

    modules = (
        db.query(Module)
        .filter(
            Module.course_id == course_id,
        )
        .order_by(Module.order.asc())
        .all()
    )

    return modules


@router.get("/modules/{module_id}/lessons", response_model=list[StudentLessonOut])
def list_student_module_lessons(
    module_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_student(current_user)

    module = db.query(Module).filter(Module.id == module_id).first()

    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Módulo não encontrado.",
        )

    enrollment = (
        db.query(Enrollment)
        .filter(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == module.course_id,
        )
        .first()
    )

    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem acesso a este módulo.",
        )

    lessons = (
        db.query(Lesson)
        .filter(Lesson.module_id == module_id)
        .order_by(Lesson.order.asc())
        .all()
    )

    return lessons