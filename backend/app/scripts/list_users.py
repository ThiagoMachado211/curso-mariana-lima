from app.db.session import SessionLocal
from app.models import User

def main():
    db = SessionLocal()
    users = db.query(User).all()
    for u in users:
        print(u.email, u.role)

if __name__ == "__main__":
    main()