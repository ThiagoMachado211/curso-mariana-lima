import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.deps import get_db
from app.models.lesson import Lesson
from app.models.module import Module
from app.models.user import User
from app.schemas.lesson import LessonCreate, LessonOut, LessonUpdate

router = APIRouter(prefix="/admin/lessons", tags=["admin-lessons"])


def require_admin(user: User) -> None:
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a administradores.",
        )


@router.get("", response_model=list[LessonOut])
def list_lessons(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin(current_user)

    lessons = (
        db.query(Lesson)
        .filter(Lesson.tenant_id == current_user.tenant_id)
        .order_by(Lesson.order.asc(), Lesson.title.asc())
        .all()
    )
    return lessons


@router.post("", response_model=LessonOut, status_code=status.HTTP_201_CREATED)
def create_lesson(
    data: LessonCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin(current_user)

    module = (
        db.query(Module)
        .filter(
            Module.id == data.module_id,
            Module.tenant_id == current_user.tenant_id,
        )
        .first()
    )

    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Módulo não encontrado.",
        )

    lesson = Lesson(
        id=uuid.uuid4(),
        tenant_id=current_user.tenant_id,
        module_id=data.module_id,
        title=data.title.strip(),
        order=data.order,
        video_embed_url=data.video_embed_url.strip() if data.video_embed_url else None,
        pdf_url=data.pdf_url.strip() if data.pdf_url else None,
    )

    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson


@router.put("/{lesson_id}", response_model=LessonOut)
def update_lesson(
    lesson_id: uuid.UUID,
    data: LessonUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin(current_user)

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
            Module.id == data.module_id,
            Module.tenant_id == current_user.tenant_id,
        )
        .first()
    )

    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Módulo não encontrado.",
        )

    lesson.module_id = data.module_id
    lesson.title = data.title.strip()
    lesson.order = data.order
    lesson.video_embed_url = data.video_embed_url.strip() if data.video_embed_url else None
    lesson.pdf_url = data.pdf_url.strip() if data.pdf_url else None

    db.commit()
    db.refresh(lesson)
    return lesson


@router.delete("/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lesson(
    lesson_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin(current_user)

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

    db.delete(lesson)
    db.commit()
    return None