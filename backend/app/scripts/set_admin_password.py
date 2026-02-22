from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import hash_password

ADMIN_EMAIL = "admin@mariana.com"
NEW_PASSWORD = "admin"

print("SCRIPT:", __file__)

pwd = NEW_PASSWORD
print("PWD repr:", repr(pwd))
print("PWD bytes:", len(pwd.encode("utf-8")))

def main():
    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.email == ADMIN_EMAIL).first()
        if not user:
            raise RuntimeError("Admin não encontrado. Rode o seed primeiro.")

        user.password_hash = hash_password(NEW_PASSWORD)
        db.commit()

        print("✅ Senha definida para:", ADMIN_EMAIL)
        print("Senha:", NEW_PASSWORD)
    finally:
        db.close()


if __name__ == "__main__":
    main()