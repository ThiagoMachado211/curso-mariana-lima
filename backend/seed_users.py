import uuid
from sqlalchemy import text
from app.db.session import SessionLocal
from app.core.security import hash_password

db = SessionLocal()

try:
    # 🔹 Buscar tenant existente
    tenant = db.execute(
        text("SELECT id FROM tenants LIMIT 1")
    ).fetchone()

    if not tenant:
        raise Exception("Nenhum tenant encontrado. Crie um tenant primeiro.")

    tenant_id = tenant[0]
    print(f"Tenant encontrado: {tenant_id}")

    users = [
        {
            "name": "Mariana Lima",
            "email": "mariana@admin.com",
            "password": "123456",
            "role": "admin",
        },
        {
            "name": "Usuário Teste",
            "email": "teste@user.com",
            "password": "123456",
            "role": "student",
        },
    ]

    for u in users:
        existing = db.execute(
            text("SELECT id FROM users WHERE email = :email"),
            {"email": u["email"]}
        ).fetchone()

        if existing:
            print(f"Usuário já existe: {u['email']}")
            continue

        db.execute(
            text("""
                INSERT INTO users (id, tenant_id, name, email, password_hash, role, is_active)
                VALUES (:id, :tenant_id, :name, :email, :password_hash, :role, :is_active)
            """),
            {
                "id": str(uuid.uuid4()),
                "tenant_id": tenant_id,
                "name": u["name"],
                "email": u["email"],
                "password_hash": hash_password(u["password"]),
                "role": u["role"],
                "is_active": True,
            }
        )

        print(f"Usuário criado: {u['email']}")

    db.commit()

finally:
    db.close()