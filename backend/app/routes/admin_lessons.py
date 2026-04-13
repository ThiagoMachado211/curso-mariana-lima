import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.deps import get_db
from app.models.lesson import Lesson
from app.models.lesson_pdf import LessonPdf
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


def normalize_video_url(value: str | None) -> str | None:
    if not value:
        return None
    value = value.strip()
    return value or None


def normalize_legacy_pdf_url(value: str | None) -> str | None:
    if not value:
        return None
    value = value.strip()
    return value or None


def validate_lesson_content(video_embed_url, pdfs):
    has_video = bool(video_embed_url and video_embed_url.strip())
    pdfs = pdfs or []

    if has_video and len(pdfs) > 0:
        raise HTTPException(
            status_code=400,
            detail="A aula pode ter vídeo ou PDFs, mas não ambos.",
        )

    if len(pdfs) > 25:
        raise HTTPException(
            status_code=400,
            detail="A aula pode ter no máximo 25 PDFs.",
        )

    if not has_video and len(pdfs) == 0:
        raise HTTPException(
            status_code=400,
            detail="A aula deve ter um vídeo ou pelo menos um PDF.",
        )


def serialize_lesson(lesson: Lesson) -> dict:
    return {
        "id": lesson.id,
        "tenant_id": lesson.tenant_id,
        "module_id": lesson.module_id,
        "title": lesson.title,
        "order": lesson.order,
        "video_embed_url": lesson.video_embed_url,
        "pdf_url": lesson.pdf_url,  # legado
        "pdfs": [
            {
                "id": pdf.id,
                "title": pdf.title,
                "pdf_url": pdf.pdf_url,
                "order": pdf.order,
            }
            for pdf in sorted(lesson.pdfs or [], key=lambda x: x.order)
        ],
    }


def replace_lesson_pdfs(lesson: Lesson, pdfs_data: list) -> None:
    lesson.pdfs.clear()

    for pdf in sorted(pdfs_data, key=lambda x: x.order):
        lesson.pdfs.append(
            LessonPdf(
                id=uuid.uuid4(),
                title=pdf.title.strip(),
                pdf_url=pdf.pdf_url.strip(),
                order=pdf.order,
            )
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

    return [serialize_lesson(lesson) for lesson in lessons]


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

    video_embed_url = normalize_video_url(data.video_embed_url)
    pdfs_data = list(data.pdfs or [])

    # compatibilidade opcional com modelo antigo
    legacy_pdf_url = normalize_legacy_pdf_url(getattr(data, "pdf_url", None))
    if legacy_pdf_url and not pdfs_data:
        from types import SimpleNamespace
        pdfs_data = [
            SimpleNamespace(
                title="Material da aula",
                pdf_url=legacy_pdf_url,
                order=1,
            )
        ]

    validate_lesson_content(video_embed_url, pdfs_data)

    lesson = Lesson(
        id=uuid.uuid4(),
        tenant_id=current_user.tenant_id,
        module_id=data.module_id,
        title=data.title.strip(),
        order=data.order,
        video_embed_url=video_embed_url,
        pdf_url=None,  # legado desativado para novas aulas
    )

    db.add(lesson)
    db.flush()

    replace_lesson_pdfs(lesson, pdfs_data)

    db.commit()
    db.refresh(lesson)

    return serialize_lesson(lesson)


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

    module_id = data.module_id if data.module_id is not None else lesson.module_id

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

    video_embed_url = normalize_video_url(
        data.video_embed_url if data.video_embed_url is not None else lesson.video_embed_url
    )

    pdfs_data = data.pdfs if data.pdfs is not None else lesson.pdfs

    # compatibilidade opcional com modelo antigo
    legacy_pdf_url = normalize_legacy_pdf_url(getattr(data, "pdf_url", None))
    if legacy_pdf_url and data.pdfs is None:
        from types import SimpleNamespace
        pdfs_data = [
            SimpleNamespace(
                title="Material da aula",
                pdf_url=legacy_pdf_url,
                order=1,
            )
        ]

    validate_lesson_content(video_embed_url, pdfs_data)

    if data.module_id is not None:
        lesson.module_id = data.module_id

    if data.title is not None:
        lesson.title = data.title.strip()

    if data.order is not None:
        lesson.order = data.order

    lesson.video_embed_url = video_embed_url
    lesson.pdf_url = None  # legado desativado

    if data.pdfs is not None or legacy_pdf_url is not None:
        replace_lesson_pdfs(lesson, pdfs_data)

    db.commit()
    db.refresh(lesson)

    return serialize_lesson(lesson)


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