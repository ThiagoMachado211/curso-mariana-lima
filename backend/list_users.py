from app.db.session import SessionLocal
from app.models.user import User

db = SessionLocal()

try:
    users = db.query(User).all()

    for user in users:
        print("ID:", user.id)
        print("NOME:", user.name)
        print("EMAIL:", user.email)
        print("ROLE:", user.role)
        print("TENANT_ID:", user.tenant_id)
        print("-" * 50)

finally:
    db.close()