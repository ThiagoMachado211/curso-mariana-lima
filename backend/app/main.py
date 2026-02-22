from fastapi import FastAPI
from sqlalchemy import text
from app.db.session import engine
from app.routes.auth import router as auth_router

app = FastAPI(title="Curso Mariana Lima API")

app.include_router(auth_router)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/db-check")
def db_check():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1")).scalar()
    return {"db": "ok", "result": result}