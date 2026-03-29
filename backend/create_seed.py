import uuid

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.tenant import Tenant
from app.models.user import User

# AJUSTE ESTE IMPORT conforme o seu projeto
from app.core.security import hash_password


def main():
    db = SessionLocal()

    try:
        # 1. procurar tenant existente pelo slug
        tenant = db.execute(
            select(Tenant).where(Tenant.slug == "curso-mariana-lima")
        ).scalar_one_or_none()

        if not tenant:
            tenant = Tenant(
                id=uuid.uuid4(),
                slug="curso-mariana-lima",
                name="Curso Mariana Lima",
                mp_access_token=None,
                mp_env="sandbox",
            )
            db.add(tenant)
            db.commit()
            db.refresh(tenant)
            print(f"Tenant criado: {tenant.id}")
        else:
            print(f"Tenant já existe: {tenant.id}")

        # 2. procurar usuário existente pelo email
        user = db.execute(
            select(User).where(User.email == "thiago@user.com")
        ).scalar_one_or_none()

        if not user:
            user = User(
                id=uuid.uuid4(),
                tenant_id=tenant.id,
                name="Thiago",
                email="thiago@user.com",
                password_hash=hash_password("123456"),
                role="admin",
                is_active=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"Usuário criado: {user.email}")
        else:
            print(f"Usuário já existe: {user.email}")

    finally:
        db.close()


if __name__ == "__main__":
    main()