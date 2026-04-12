import os

class Settings:
    app_name: str = "Matemática Essencial API"

    database_url: str = os.getenv("DATABASE_URL", "")

    secret_key: str = os.getenv("SECRET_KEY", "10510788")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")
    MAIL_FROM: str = os.getenv("MAIL_FROM", "")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://127.0.0.1:5500")

settings = Settings()