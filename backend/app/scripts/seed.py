import uuid

from app.db.session import SessionLocal
from app.models.tenant import Tenant
from app.models.user import User
from app.models.course import Course


def get_or_create_tenant(db):
    slug = "curso-mariana-lima"
    tenant = db.query(Tenant).filter(Tenant.slug == slug).first()
    if tenant:
        return tenant

    tenant = Tenant(
        id=uuid.uuid4(),
        slug=slug,
        name="Curso Mariana Lima",
    )
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    return tenant


def get_or_create_admin(db, tenant_id):
    email = "admin@mariana.com"
    user = db.query(User).filter(User.email == email).first()
    if user:
        return user

    user = User(
        tenant_id=tenant_id,
        name="Mariana Lima",
        email=email,
        role="admin",
        password_hash=None,  # MVP: definir senha depois
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_or_create_course(db, tenant_id):
    slug = "matematica-enem"
    course = db.query(Course).filter(Course.slug == slug, Course.tenant_id == tenant_id).first()
    if course:
        return course

    course = Course(
        tenant_id=tenant_id,
        title="Matemática para o ENEM",
        slug=slug,
        description="Curso completo de matemática para o ENEM",
        price_cents=29700,
        is_active=True,
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


def main():
    db = SessionLocal()
    try:
        tenant = get_or_create_tenant(db)
        admin = get_or_create_admin(db, tenant.id)
        course = get_or_create_course(db, tenant.id)

        print("✅ Seed concluído")
        print("Tenant:", tenant.id, tenant.slug)
        print("Admin:", admin.id, admin.email)
        print("Course:", course.id, course.slug)
    finally:
        db.close()


if __name__ == "__main__":
    main()