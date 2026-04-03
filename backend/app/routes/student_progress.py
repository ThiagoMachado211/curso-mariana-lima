from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.deps import get_db
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.lesson import Lesson
from app.models.lesson_progress import LessonProgress
from app.models.module import Module
from app.models.user import User

router = APIRouter(prefix="/student", tags=["student-progress"])


@router.post("/lessons/{lesson_id}/complete", status_code=status.HTTP_200_OK)
def complete_lesson(
    lesson_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lesson_data = (
        db.query(Lesson, Module, Course)
        .join(Module, Lesson.module_id == Module.id)
        .join(Course, Module.course_id == Course.id)
        .filter(
            Lesson.id == lesson_id,
            Course.tenant_id == current_user.tenant_id,
            Course.is_active == True,
        )
        .first()
    )

    if not lesson_data:
        raise HTTPException(status_code=404, detail="Aula não encontrada.")

    lesson, module, course = lesson_data

    enrollment = (
        db.query(Enrollment)
        .filter(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == course.id,
            Enrollment.tenant_id == current_user.tenant_id,
            Enrollment.status == "active",
        )
        .first()
    )

    if not enrollment:
        raise HTTPException(
            status_code=403,
            detail="Você não está matriculado neste curso.",
        )

    progress = (
        db.query(LessonProgress)
        .filter(
            LessonProgress.user_id == current_user.id,
            LessonProgress.lesson_id == lesson.id,
            LessonProgress.tenant_id == current_user.tenant_id,
        )
        .first()
    )

    if progress:
        if progress.completed:
            return {"message": "Aula já estava concluída."}

        progress.completed = True
        progress.completed_at = datetime.now(timezone.utc)
        db.commit()
        return {"message": "Aula marcada como concluída com sucesso."}

    progress = LessonProgress(
        tenant_id=current_user.tenant_id,
        user_id=current_user.id,
        lesson_id=lesson.id,
        completed=True,
        completed_at=datetime.now(timezone.utc),
    )

    db.add(progress)
    db.commit()

    return {"message": "Aula marcada como concluída com sucesso."}