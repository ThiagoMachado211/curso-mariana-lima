from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from jose import jwt
from passlib.context import CryptContext

from app.core.config import JWT_SECRET, JWT_ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

# Troca bcrypt -> argon2 (mais moderno e evita o erro de 72 bytes)
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash((password or "").strip())


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify((password or "").strip(), password_hash)


def create_access_token(
    subject: str,
    expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES,
    extra: Optional[dict[str, Any]] = None,
) -> str:
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=expires_minutes)

    to_encode: dict[str, Any] = {"sub": subject, "exp": expire, "iat": now}
    if extra:
        to_encode.update(extra)

    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)