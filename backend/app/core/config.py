import os

class Settings:
    app_name: str = "Matemática Essencial API"
    
    database_url: str = os.getenv("DATABASE_URL", "")
    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")
    MAIL_FROM: str = os.getenv("MAIL_FROM", "")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://127.0.0.1:5500")

settings = Settings()