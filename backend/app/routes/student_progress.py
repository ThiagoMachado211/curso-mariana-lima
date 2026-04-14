from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.deps import get_db
from app.models.lesson import Lesson
from app.models.lesson_progress import LessonProgress
from app.models.user import User

router = APIRouter(prefix="/student", tags=["student-progress"])


@router.post("/lessons/{lesson_id}/complete")
def mark_lesson_complete(
    lesson_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()

    if not lesson:
        raise HTTPException(status_code=404, detail="Aula não encontrada.")

    progress = (
        db.query(LessonProgress)
        .filter(
            LessonProgress.lesson_id == lesson_id,
            LessonProgress.user_id == current_user.id,
        )
        .first()
    )

    if not progress:
        progress = LessonProgress(
            lesson_id=lesson_id,
            user_id=current_user.id,
            completed=True,
        )
        db.add(progress)
    else:
        progress.completed = True

    db.commit()
    return {"message": "Aula marcada como concluída."}


@router.post("/lessons/{lesson_id}/uncomplete")
def mark_lesson_uncomplete(
    lesson_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()

    if not lesson:
        raise HTTPException(status_code=404, detail="Aula não encontrada.")

    progress = (
        db.query(LessonProgress)
        .filter(
            LessonProgress.lesson_id == lesson_id,
            LessonProgress.user_id == current_user.id,
        )
        .first()
    )

    if progress:
        progress.completed = False
        db.commit()

    return {"message": "Aula desmarcada com sucesso."}