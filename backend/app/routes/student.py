from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.deps import get_db
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.lesson import Lesson
from app.models.lesson_progress import LessonProgress
from app.models.module import Module
from app.models.user import User

router = APIRouter(prefix="/student", tags=["student"])


@router.get("/courses")
def list_student_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    enrollments = (
        db.query(Enrollment, Course)
        .join(Course, Enrollment.course_id == Course.id)
        .filter(
            Enrollment.user_id == current_user.id,
            Enrollment.tenant_id == current_user.tenant_id,
            Enrollment.status == "active",
            Course.tenant_id == current_user.tenant_id,
            Course.is_active == True,
        )
        .order_by(Course.title.asc())
        .all()
    )

    return [
        {
            "id": str(course.id),
            "title": course.title,
            "description": course.description,
        }
        for enrollment, course in enrollments
    ]


@router.get("/courses/{course_id}")
def get_student_course(
    course_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
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
        raise HTTPException(status_code=404, detail="Curso não encontrado para este aluno.")

    course = (
        db.query(Course)
        .filter(
            Course.id == course_id,
            Course.tenant_id == current_user.tenant_id,
            Course.is_active == True,
        )
        .first()
    )

    if not course:
        raise HTTPException(status_code=404, detail="Curso não encontrado.")

    modules = (
        db.query(Module)
        .filter(Module.course_id == course.id)
        .order_by(Module.order.asc())
        .all()
    )

    progress_rows = (
        db.query(LessonProgress)
        .filter(
            LessonProgress.user_id == current_user.id,
            LessonProgress.tenant_id == current_user.tenant_id,
            LessonProgress.completed == True,
        )
        .all()
    )

    completed_lesson_ids = {row.lesson_id for row in progress_rows}

    response_modules = []
    total_lessons = 0
    completed_lessons = 0

    for module in modules:
        lessons = (
            db.query(Lesson)
            .filter(Lesson.module_id == module.id)
            .order_by(Lesson.order.asc())
            .all()
        )

        response_lessons = []

        for lesson in lessons:
            lesson_completed = lesson.id in completed_lesson_ids

            total_lessons += 1
            if lesson_completed:
                completed_lessons += 1

            response_lessons.append(
                {
                    "id": str(lesson.id),
                    "title": lesson.title,
                    "order": lesson.order,
                    "video_embed_url": lesson.video_embed_url,
                    "pdf_url": lesson.pdf_url,
                    "completed": lesson_completed,
                }
            )

        response_modules.append(
            {
                "id": str(module.id),
                "title": module.title,
                "order": module.order,
                "lessons": response_lessons,
            }
        )

    percentage = round((completed_lessons / total_lessons) * 100) if total_lessons > 0 else 0

    return {
        "id": str(course.id),
        "title": course.title,
        "description": course.description,
        "progress": {
            "completed_lessons": completed_lessons,
            "total_lessons": total_lessons,
            "percentage": percentage,
        },
        "modules": response_modules,
    }