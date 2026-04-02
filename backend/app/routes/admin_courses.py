import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.deps import get_db
from app.models.course import Course
from app.models.user import User
from app.schemas.course import CourseCreate, CourseOut, CourseUpdate
from app.routes.auth import get_current_admin_user


router = APIRouter(prefix="/admin/courses", tags=["admin-courses"])


def require_admin(user: User) -> None:
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a administradores.",
        )


@router.get("", response_model=list[CourseOut])
def list_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin(current_user)

    courses = (
        db.query(Course)
        .filter(Course.tenant_id == current_user.tenant_id)
        .order_by(Course.title.asc())
        .all()
    )
    return courses


@router.post("", response_model=CourseOut, status_code=status.HTTP_201_CREATED)
def create_course(
    data: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin(current_user)

    existing_slug = (
        db.query(Course)
        .filter(
            Course.tenant_id == current_user.tenant_id,
            Course.slug == data.slug,
        )
        .first()
    )

    if existing_slug:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe um curso com esse slug.",
        )

    course = Course(
        id=uuid.uuid4(),
        tenant_id=current_user.tenant_id,
        title=data.title.strip(),
        slug=data.slug.strip().lower(),
        description=data.description.strip() if data.description else None,
        price_cents=data.price_cents,
        is_active=data.is_active,
        is_published=data.is_published,
        currency=data.currency.strip().upper(),
    )

    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@router.put("/{course_id}", response_model=CourseOut)
def update_course(
    course_id: uuid.UUID,
    data: CourseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin(current_user)

    course = (
        db.query(Course)
        .filter(
            Course.id == course_id,
            Course.tenant_id == current_user.tenant_id,
        )
        .first()
    )

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curso não encontrado.",
        )

    existing_slug = (
        db.query(Course)
        .filter(
            Course.tenant_id == current_user.tenant_id,
            Course.slug == data.slug.strip().lower(),
            Course.id != course_id,
        )
        .first()
    )

    if existing_slug:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe outro curso com esse slug.",
        )

    course.title = data.title.strip()
    course.slug = data.slug.strip().lower()
    course.description = data.description.strip() if data.description else None
    course.price_cents = data.price_cents
    course.is_active = data.is_active
    course.is_published = data.is_published
    course.currency = data.currency.strip().upper()

    db.commit()
    db.refresh(course)
    return course


@router.get("/options")
def list_courses_options(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    courses = (
        db.query(Course)
        .filter(Course.tenant_id == current_admin.tenant_id)
        .order_by(Course.title.asc())
        .all()
    )

    return [
        {
            "id": course.id,
            "title": course.title,
        }
        for course in courses
    ]


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(
    course_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin(current_user)

    course = (
        db.query(Course)
        .filter(
            Course.id == course_id,
            Course.tenant_id == current_user.tenant_id,
        )
        .first()
    )

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curso não encontrado.",
        )

    db.delete(course)
    db.commit()
    return None