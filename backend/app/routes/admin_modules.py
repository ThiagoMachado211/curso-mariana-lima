import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.deps import get_db
from app.models.course import Course
from app.models.module import Module
from app.models.user import User
from app.schemas.module import ModuleCreate, ModuleOut, ModuleUpdate

router = APIRouter(prefix="/admin/modules", tags=["admin-modules"])


def require_admin(user: User) -> None:
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a administradores.",
        )


@router.get("", response_model=list[ModuleOut])
def list_modules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin(current_user)

    modules = (
        db.query(Module)
        .filter(Module.tenant_id == current_user.tenant_id)
        .order_by(Module.order.asc(), Module.title.asc())
        .all()
    )
    return modules


@router.post("", response_model=ModuleOut, status_code=status.HTTP_201_CREATED)
def create_module(
    data: ModuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin(current_user)

    course = (
        db.query(Course)
        .filter(
            Course.id == data.course_id,
            Course.tenant_id == current_user.tenant_id,
        )
        .first()
    )

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curso não encontrado.",
        )

    module = Module(
        id=uuid.uuid4(),
        tenant_id=current_user.tenant_id,
        course_id=data.course_id,
        title=data.title.strip(),
        order=data.order,
    )

    db.add(module)
    db.commit()
    db.refresh(module)
    return module


@router.put("/{module_id}", response_model=ModuleOut)
def update_module(
    module_id: uuid.UUID,
    data: ModuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin(current_user)

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

    course = (
        db.query(Course)
        .filter(
            Course.id == data.course_id,
            Course.tenant_id == current_user.tenant_id,
        )
        .first()
    )

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curso não encontrado.",
        )

    module.course_id = data.course_id
    module.title = data.title.strip()
    module.order = data.order

    db.commit()
    db.refresh(module)
    return module


@router.delete("/{module_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_module(
    module_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin(current_user)

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

    db.delete(module)
    db.commit()
    return None