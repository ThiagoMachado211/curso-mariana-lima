import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.deps import get_db
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.lesson import Lesson
from app.models.module import Module
from app.models.user import User
from app.schemas.course import CourseOut
from app.schemas.lesson import LessonOut
from app.schemas.module import ModuleOut

router = APIRouter(prefix="/student", tags=["student"])


# =========================
# HELPERS
# =========================

def ensure_student(user: User):
    if user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas alunos podem acessar esta área.",
        )


def ensure_enrollment(
    db: Session,
    current_user: User,
    course_id: uuid.UUID,
):
    enrollment = (
        db.query(Enrollment)
        .filter(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == course_id,
            Enrollment.tenant_id == current_user.tenant_id,
            Enrollment.status == "active",
        )
        .first()
    )

    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não está matriculado neste curso.",
        )


# =========================
# COURSES
# =========================

@router.get("/courses", response_model=list[CourseOut])
def list_student_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_student(current_user)

    courses = (
        db.query(Course)
        .join(Enrollment, Enrollment.course_id == Course.id)
        .filter(
            Course.tenant_id == current_user.tenant_id,
            Course.is_active == True,
            Course.is_published == True,
            Enrollment.user_id == current_user.id,
            Enrollment.tenant_id == current_user.tenant_id,
            Enrollment.status == "active",
        )
        .order_by(Course.title.asc())
        .all()
    )

    return courses


@router.get("/courses/{course_id}", response_model=CourseOut)
def get_student_course(
    course_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_student(current_user)

    course = (
        db.query(Course)
        .filter(
            Course.id == course_id,
            Course.tenant_id == current_user.tenant_id,
            Course.is_active == True,
            Course.is_published == True,
        )
        .first()
    )

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curso não encontrado.",
        )

    ensure_enrollment(db, current_user, course.id)

    return course


# =========================
# MODULES
# =========================

@router.get("/courses/{course_id}/modules", response_model=list[ModuleOut])
def list_student_course_modules(
    course_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_student(current_user)

    course = (
        db.query(Course)
        .filter(
            Course.id == course_id,
            Course.tenant_id == current_user.tenant_id,
            Course.is_active == True,
            Course.is_published == True,
        )
        .first()
    )

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curso não encontrado.",
        )

    ensure_enrollment(db, current_user, course.id)

    modules = (
        db.query(Module)
        .filter(
            Module.course_id == course_id,
            Module.tenant_id == current_user.tenant_id,
        )
        .order_by(Module.order.asc(), Module.title.asc())
        .all()
    )

    return modules


# =========================
# LESSONS (LIST)
# =========================

@router.get("/modules/{module_id}/lessons", response_model=list[LessonOut])
def list_student_module_lessons(
    module_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_student(current_user)

    module = (
        db.query(Module)
        .filter(
            Module.id == module_id,
            Module.tenant_id == current_user.tenant_id,
        )
        .first()
    )

    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Módulo não encontrado.",
        )

    course = (
        db.query(Course)
        .filter(
            Course.id == module.course_id,
            Course.tenant_id == current_user.tenant_id,
            Course.is_active == True,
            Course.is_published == True,
        )
        .first()
    )

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curso não encontrado.",
        )

    ensure_enrollment(db, current_user, course.id)

    lessons = (
        db.query(Lesson)
        .filter(
            Lesson.module_id == module_id,
            Lesson.tenant_id == current_user.tenant_id,
        )
        .order_by(Lesson.order.asc(), Lesson.title.asc())
        .all()
    )

    return lessons


# =========================
# LESSON (DETAIL)
# =========================

@router.get("/lessons/{lesson_id}", response_model=LessonOut)
def get_student_lesson(
    lesson_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_student(current_user)

    lesson = (
        db.query(Lesson)
        .filter(
            Lesson.id == lesson_id,
            Lesson.tenant_id == current_user.tenant_id,
        )
        .first()
    )

    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aula não encontrada.",
        )

    module = (
        db.query(Module)
        .filter(
            Module.id == lesson.module_id,
            Module.tenant_id == current_user.tenant_id,
        )
        .first()
    )

    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Módulo não encontrado.",
        )

    course = (
        db.query(Course)
        .filter(
            Course.id == module.course_id,
            Course.tenant_id == current_user.tenant_id,
            Course.is_active == True,
            Course.is_published == True,
        )
        .first()
    )

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curso não encontrado.",
        )

    ensure_enrollment(db, current_user, course.id)

    return lesson