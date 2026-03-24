from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.db.session import engine
from app.core.config import settings

from app.routes import admin_billing
from app.routes import billing
from app.routes import webhooks
from app.routes import student
from app.routes.auth import router as auth_router
from app.routes.admin_modules import router as admin_modules_router
from app.routes.admin_lessons import router as admin_lessons_router
from app.routes.admin_courses import router as admin_courses_router
from app.routes.admin_enrollments import router as admin_enrollments_router
from app.routes.admin_directory import router as admin_directory_router

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://127.0.0.1:5500",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(admin_modules_router)
app.include_router(admin_lessons_router)
app.include_router(admin_courses_router)
app.include_router(admin_enrollments_router)
app.include_router(admin_directory_router)
app.include_router(admin_billing.router)
app.include_router(billing.router)
app.include_router(webhooks.router)
app.include_router(student.router)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/db-check")
def db_check():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1")).scalar()
    return {"db": "ok", "result": result}