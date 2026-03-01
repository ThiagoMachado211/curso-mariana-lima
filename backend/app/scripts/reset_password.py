from app.db.session import SessionLocal
from app.models import User

# 🔁 ajuste para a função real do seu projeto:
from app.core.security import hash_password

EMAIL = "admin@mariana.com"
NEW_PASSWORD = "123456"


def main():
    db = SessionLocal()

    user = db.query(User).filter(User.email == EMAIL).first()
    if not user:
        raise SystemExit(f"Usuário não encontrado: {EMAIL}")

    user.password_hash = hash_password(NEW_PASSWORD)
    db.commit()

    print("Senha atualizada com sucesso!")
    print("Email:", EMAIL)
    print("Nova senha:", NEW_PASSWORD)


if __name__ == "__main__":
    main()