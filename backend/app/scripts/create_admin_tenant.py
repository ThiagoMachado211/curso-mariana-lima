import uuid
import re

from app.db.session import SessionLocal
from app.models import Tenant, User

# ajuste para o nome correto do hasher no seu projeto:
from app.core.security import hash_password  # <-- MUDE se o nome for outro


def slugify(text: str) -> str:
    text = text.strip().lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")


def main():
    db = SessionLocal()

    tenant_name = "Tenant B"
    tenant_slug = slugify(tenant_name)

    tenant = Tenant(
        id=uuid.uuid4(),
        name=tenant_name,
        slug=tenant_slug,   # ✅ obrigatório no seu schema
    )
    db.add(tenant)
    db.commit()
    db.refresh(tenant)

    admin = User(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        name="Admin B",
        email="adminb@teste.com",
        password_hash=hash_password("123456"),  # ✅ ajuste conforme seu projeto
        role="admin",
        is_active=True,
    )
    db.add(admin)
    db.commit()

    print("Tenant B:", tenant.id, tenant.slug)
    print("Admin B:", admin.email, "senha: 123456")


if __name__ == "__main__":
    main()