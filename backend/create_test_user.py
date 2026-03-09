import uuid
from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import hash_password

db = SessionLocal()

try:
    user = User(
        tenant_id=uuid.UUID("49dd10ca-962d-4f3a-8bea-80e403a38e40"),
        name="Aluno Teste",
        email="aluno@teste.com",
        password_hash=hash_password("123456"),
        role="user",
        is_active=True
    )

    db.add(user)
    db.commit()

    print("Usuário de teste criado com sucesso.")

finally:
    db.close()