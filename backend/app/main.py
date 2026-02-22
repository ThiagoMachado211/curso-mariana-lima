from fastapi import FastAPI
from sqlalchemy import text
from app.db.session import engine
from app.routes.auth import router as auth_router
from app.routes.admin_modules import router as admin_modules_router
from app.routes.admin_lessons import router as admin_lessons_router
from app.routes.admin_courses import router as admin_courses_router


app = FastAPI(title="Curso Mariana Lima API")

app.include_router(auth_router)
app.include_router(admin_modules_router)
app.include_router(admin_lessons_router)
app.include_router(admin_courses_router)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/db-check")
def db_check():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1")).scalar()
    return {"db": "ok", "result": result}