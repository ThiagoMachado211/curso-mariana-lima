from app.core.config import settings
from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import hash_password

db = SessionLocal()

user = User(
    name="Thiago",
    email="thiago@user.com",
    password_hash=hash_password("123456"),
    role="admin",
    is_active=True,
    tenant_id="COLOQUE_O_TENANT_ID_AQUI"
)

db.add(user)
db.commit()
db.close()

print("Usuário criado com sucesso.")