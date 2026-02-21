from fastapi import FastAPI
from fastapi.responses import Response

app = FastAPI(title="Curso Mariana Lima API")

@app.get("/")
def read_root():
    return {"message": "API Curso Mariana Lima online 🚀"}

@app.get("/health")
def healthcheck():
    return {"status": "ok"}

@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return Response(status_code=204)