import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import admin_required
from app.db.deps import get_db
from app.models.module import Module
from app.models.course import Course
from app.schemas.module import ModuleCreate, ModuleUpdate, ModuleOut

router = APIRouter(prefix="/admin/modules", tags=["admin-modules"])


@router.post("", response_model=ModuleOut)
def create_module(
    data: ModuleCreate,
    db: Session = Depends(get_db),
    _admin=Depends(admin_required),
):
    course = db.query(Course).filter(Course.id == data.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Curso não encontrado")

    module = Module(
        tenant_id=course.tenant_id,
        course_id=data.course_id,
        title=data.title,
        order=data.order,
    )
    db.add(module)
    db.commit()
    db.refresh(module)
    return module


@router.get("", response_model=list[ModuleOut])
def list_modules(
    course_id: uuid.UUID,
    db: Session = Depends(get_db),
    _admin=Depends(admin_required),
):
    return (
        db.query(Module)
        .filter(Module.course_id == course_id)
        .order_by(Module.order.asc())
        .all()
    )


@router.put("/{module_id}", response_model=ModuleOut)
def update_module(
    module_id: uuid.UUID,
    data: ModuleUpdate,
    db: Session = Depends(get_db),
    _admin=Depends(admin_required),
):
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Módulo não encontrado")

    if data.title is not None:
        module.title = data.title
    if data.order is not None:
        module.order = data.order

    db.commit()
    db.refresh(module)
    return module