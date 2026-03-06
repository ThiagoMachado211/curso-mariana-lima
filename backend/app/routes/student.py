from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.module import Module
from app.models.lesson import Lesson
from app.models.user import User
from app.core.deps import get_current_user


router = APIRouter(prefix="/student", tags=["student"])


@router.get("/my-courses")
def my_courses(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):

    courses = (
        db.query(Course)
        .join(Enrollment, Enrollment.course_id == Course.id)
        .filter(
            Enrollment.user_id == user.id,
            Enrollment.status == "active"
        )
        .all()
    )

    return courses


@router.get("/courses/{course_id}/tree")
def student_course_tree(
    course_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):

    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == user.id,
        Enrollment.course_id == course_id,
        Enrollment.status == "active"
    ).first()

    if not enrollment:
        raise HTTPException(status_code=403, detail="Acesso não autorizado")

    course = db.query(Course).filter(Course.id == course_id).first()

    if not course:
        raise HTTPException(status_code=404, detail="Curso não encontrado")

    modules = (
        db.query(Module)
        .filter(Module.course_id == course.id)
        .order_by(Module.order.asc())
        .all()
    )

    result = {
        "id": str(course.id),
        "title": course.title,
        "modules": []
    }

    for module in modules:

        lessons = (
            db.query(Lesson)
            .filter(Lesson.module_id == module.id)
            .order_by(Lesson.order.asc())
            .all()
        )

        result["modules"].append({
            "id": str(module.id),
            "title": module.title,
            "order": module.order,
            "lessons": [
                {
                    "id": str(lesson.id),
                    "title": lesson.title,
                    "order": lesson.order
                }
                for lesson in lessons
            ]
        })

    return result