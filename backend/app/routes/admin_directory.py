from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.deps import get_db
from app.models.course import Course
from app.models.user import User

router = APIRouter(prefix="/admin/directory", tags=["admin-directory"])


def ensure_admin(current_user: User):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem acessar esta área.",
        )


@router.get("/students")
def list_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_admin(current_user)

    students = (
        db.query(User)
        .filter(
            User.tenant_id == current_user.tenant_id,
            User.role == "student",
            User.is_active == True,
        )
        .order_by(User.name.asc())
        .all()
    )

    return [
        {
            "id": student.id,
            "name": student.name,
            "email": student.email,
        }
        for student in students
    ]


@router.get("/users")
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_admin(current_user)

    users = (
        db.query(User)
        .filter(User.tenant_id == current_user.tenant_id)
        .order_by(User.name.asc())
        .all()
    )

    return [
        {
            "id": user.id,
            "name": user.name,
            "last_name": user.last_name,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
        }
        for user in users
    ]


@router.get("/courses")
def list_courses_for_admin_directory(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_admin(current_user)

    courses = (
        db.query(Course)
        .filter(
            Course.tenant_id == current_user.tenant_id,
            Course.is_active == True,
        )
        .order_by(Course.title.asc())
        .all()
    )

    return [
        {
            "id": course.id,
            "title": course.title,
            "is_published": course.is_published,
        }
        for course in courses
    ]