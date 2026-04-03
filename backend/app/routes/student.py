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


def get_active_student_enrollments(db: Session, current_user: User):
    return (
        db.query(Enrollment, Course)
        .join(Course, Enrollment.course_id == Course.id)
        .filter(
            Enrollment.user_id == current_user.id,
            Enrollment.status == "active",
            Course.is_active == True,
        )
        .order_by(Course.title.asc())
        .all()
    )


@router.get("/courses")
def list_student_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    enrollments = get_active_student_enrollments(db, current_user)

    return [
        {
            "id": str(course.id),
            "title": course.title,
            "slug": course.slug,
            "description": course.description,
            "price_cents": course.price_cents,
            "currency": course.currency,
            "is_active": course.is_active,
            "is_published": course.is_published,
        }
        for enrollment, course in enrollments
    ]


@router.get("/courses/{course_id}")
def get_student_course(
    course_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    allowed_courses = get_active_student_enrollments(db, current_user)

    target_course_id = str(course_id)
    course = None

    for enrollment, enrolled_course in allowed_courses:
        if str(enrolled_course.id) == target_course_id:
            course = enrolled_course
            break

    if not course:
        raise HTTPException(status_code=404, detail="Curso não encontrado para este aluno.")

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
            LessonProgress.completed == True,
        )
        .all()
    )

    completed_lesson_ids = {str(row.lesson_id) for row in progress_rows}

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
            lesson_completed = str(lesson.id) in completed_lesson_ids

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