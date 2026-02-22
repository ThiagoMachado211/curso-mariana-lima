import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import admin_required
from app.db.deps import get_db
from app.models.course import Course
from app.models.module import Module
from app.models.lesson import Lesson
from app.schemas.course import CourseOut, CourseTree, ModuleNode, LessonNode

router = APIRouter(prefix="/admin/courses", tags=["admin-courses"])


@router.get("", response_model=list[CourseOut])
def list_courses(
    db: Session = Depends(get_db),
    _admin=Depends(admin_required),
):
    return db.query(Course).order_by(Course.title.asc()).all()


@router.get("/{course_id}/tree", response_model=CourseTree)
def course_tree(
    course_id: uuid.UUID,
    db: Session = Depends(get_db),
    _admin=Depends(admin_required),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Curso não encontrado")

    modules = (
        db.query(Module)
        .filter(Module.course_id == course_id)
        .order_by(Module.order.asc())
        .all()
    )

    module_ids = [m.id for m in modules]
    lessons = []
    if module_ids:
        lessons = (
            db.query(Lesson)
            .filter(Lesson.module_id.in_(module_ids))
            .order_by(Lesson.order.asc())
            .all()
        )

    lessons_by_module: dict[uuid.UUID, list[LessonNode]] = {m.id: [] for m in modules}
    for l in lessons:
        lessons_by_module[l.module_id].append(
            LessonNode(
                id=l.id,
                title=l.title,
                order=l.order,
                video_embed_url=l.video_embed_url,
                pdf_url=l.pdf_url,
            )
        )

    module_nodes: list[ModuleNode] = []
    for m in modules:
        module_nodes.append(
            ModuleNode(
                id=m.id,
                title=m.title,
                order=m.order,
                lessons=lessons_by_module.get(m.id, []),
            )
        )

    return CourseTree(course_id=course.id, title=course.title, modules=module_nodes)