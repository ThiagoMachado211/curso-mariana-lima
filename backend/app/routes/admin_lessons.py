import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import admin_required
from app.db.deps import get_db
from app.models.lesson import Lesson
from app.models.module import Module
from app.schemas.lesson import LessonCreate, LessonUpdate, LessonOut

router = APIRouter(prefix="/admin/lessons", tags=["admin-lessons"])


@router.post("", response_model=LessonOut)
def create_lesson(
    data: LessonCreate,
    db: Session = Depends(get_db),
    _admin=Depends(admin_required),
):
    module = db.query(Module).filter(Module.id == data.module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Módulo não encontrado")

    lesson = Lesson(
        tenant_id=module.tenant_id,
        module_id=data.module_id,
        title=data.title,
        order=data.order,
        video_embed_url=data.video_embed_url,
        pdf_url=data.pdf_url,
    )
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson


@router.get("", response_model=list[LessonOut])
def list_lessons(
    module_id: uuid.UUID,
    db: Session = Depends(get_db),
    _admin=Depends(admin_required),
):
    return (
        db.query(Lesson)
        .filter(Lesson.module_id == module_id)
        .order_by(Lesson.order.asc())
        .all()
    )


@router.put("/{lesson_id}", response_model=LessonOut)
def update_lesson(
    lesson_id: uuid.UUID,
    data: LessonUpdate,
    db: Session = Depends(get_db),
    _admin=Depends(admin_required),
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Aula não encontrada")

    if data.title is not None:
        lesson.title = data.title
    if data.order is not None:
        lesson.order = data.order
    if data.video_embed_url is not None:
        lesson.video_embed_url = data.video_embed_url
    if data.pdf_url is not None:
        lesson.pdf_url = data.pdf_url

    db.commit()
    db.refresh(lesson)
    return lesson